"""pipeline/cluster.py

Assign event cluster labels to all photos in pipeline/output/catalog.json.
- Digital photos (has_exif=true): assigned by timestamp against config.yaml time windows.
- Film photos (has_exif=false): assigned by KNN against CLIP centroids.
Writes pipeline/output/metadata.json (upload-ready) and pipeline/output/low_confidence.txt.

Usage:
    uv run python pipeline/cluster.py

Dependencies:
    scikit-learn  (NearestNeighbors)
    numpy         (embedding arrays)
    pyyaml        (config parsing)
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, time, timedelta, timezone
from pathlib import Path

import numpy as np
import yaml
from sklearn.neighbors import NearestNeighbors


# Resolve paths relative to this script so the script works from any cwd.
_SCRIPT_DIR = Path(__file__).resolve().parent
_CONFIG_PATH = _SCRIPT_DIR / "config.yaml"
_PROJECT_ROOT = _SCRIPT_DIR.parent
_CATALOG_PATH = _PROJECT_ROOT / "pipeline" / "output" / "catalog.json"
_EMBEDDINGS_PATH = _PROJECT_ROOT / "pipeline" / "output" / "embeddings.npy"
_METADATA_PATH = _PROJECT_ROOT / "pipeline" / "output" / "metadata.json"
_LOW_CONF_PATH = _PROJECT_ROOT / "pipeline" / "output" / "low_confidence.txt"

ORDERED_CLUSTERS = ["prep", "photoshooting", "dining", "hupa", "dancing"]
ISRAEL_TZ = timezone(timedelta(hours=2))


def _load_config() -> dict:
    """Load and return the parsed pipeline/config.yaml."""
    if not _CONFIG_PATH.exists():
        print(f"Error: config file not found at {_CONFIG_PATH}", file=sys.stderr)
        sys.exit(1)
    with _CONFIG_PATH.open() as fh:
        return yaml.safe_load(fh)


def _time_to_minutes(t: time) -> float:
    """Convert a time object to total minutes since midnight."""
    return t.hour * 60 + t.minute + t.second / 60.0


def _nearest_cluster(t: time, time_windows: dict) -> str:
    """Return the cluster whose midpoint is closest (in minutes) to time t."""
    t_min = _time_to_minutes(t)
    best_cluster = ORDERED_CLUSTERS[0]
    best_dist = float("inf")
    for cluster in ORDERED_CLUSTERS:
        start_min = _time_to_minutes(time.fromisoformat(time_windows[cluster]["start"]))
        end_min = _time_to_minutes(time.fromisoformat(time_windows[cluster]["end"]))
        midpoint = (start_min + end_min) / 2.0
        dist = abs(t_min - midpoint)
        if dist < best_dist:
            best_dist = dist
            best_cluster = cluster
    return best_cluster


def assign_cluster_by_time(dt_israel: datetime, time_windows: dict) -> tuple[str, float]:
    """Return (cluster_name, confidence) for a datetime using config time windows.

    If the time falls within a known window, confidence is 1.0.
    If it falls outside all windows, the nearest midpoint cluster is returned
    with confidence 0.5.
    """
    # If naive (no tzinfo), treat as Israel local time directly.
    if dt_israel.tzinfo is None:
        t = dt_israel.time()
    else:
        t = dt_israel.astimezone(ISRAEL_TZ).time()
    for cluster in ORDERED_CLUSTERS:
        start = time.fromisoformat(time_windows[cluster]["start"])
        end = time.fromisoformat(time_windows[cluster]["end"])
        if start <= t < end:
            return (cluster, 1.0)
    # Fallback: find nearest cluster by midpoint distance
    nearest = _nearest_cluster(t, time_windows)
    return (nearest, 0.5)


def compute_centroids(embeddings: np.ndarray, labels: list[str]) -> dict[str, np.ndarray]:
    """Compute per-cluster centroids from anchor embeddings and their labels.

    Returns a dict mapping cluster name to normalized centroid vector.
    Clusters with zero labeled photos are omitted (with a warning to stderr).
    """
    centroids: dict[str, np.ndarray] = {}
    for cluster in ORDERED_CLUSTERS:
        mask = np.array([l == cluster for l in labels])
        if mask.sum() == 0:
            print(
                f"Warning: no anchor photos for cluster '{cluster}' — skipping centroid.",
                file=sys.stderr,
            )
            continue
        centroid = embeddings[mask].mean(axis=0)
        norm = np.linalg.norm(centroid)
        if norm > 0:
            centroid = centroid / norm
        centroids[cluster] = centroid
    return centroids


def assign_film_photos(
    film_embeddings: np.ndarray, centroids: dict[str, np.ndarray]
) -> list[tuple[str, float]]:
    """Assign each film embedding to nearest centroid; return list of (label, confidence).

    Confidence is 1.0 - cosine_distance, so it ranges [0.0, 1.0].
    Returns empty list if film_embeddings has zero rows.
    """
    if film_embeddings.shape[0] == 0:
        return []

    centroid_labels = [c for c in ORDERED_CLUSTERS if c in centroids]
    centroid_matrix = np.stack([centroids[c] for c in centroid_labels])

    nn = NearestNeighbors(n_neighbors=1, metric="cosine", algorithm="brute")
    nn.fit(centroid_matrix)
    distances, indices = nn.kneighbors(film_embeddings)

    results: list[tuple[str, float]] = []
    for dist, idx in zip(distances, indices):
        confidence = float(1.0 - dist[0])
        cluster = centroid_labels[idx[0]]
        results.append((cluster, confidence))
    return results


def write_low_confidence_report(
    entries: list[dict], out_path: Path, threshold: float
) -> int:
    """Write flagged low-confidence photo entries to a report file.

    Always creates the file (even if no entries are flagged).
    Returns the number of flagged entries written.
    """
    flagged = [e for e in entries if e["cluster_confidence"] < threshold]
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as fh:
        fh.write("# Generated by cluster.py — review before upload\n")
        fh.write("# Format: photo_id | assigned_cluster | confidence | source_path\n")
        for e in flagged:
            # Support both 'id' (metadata entries) and 'photo_id' (test fixtures)
            photo_id = e.get("id", e.get("photo_id", ""))
            source_path = e.get("source_path", "")
            fh.write(
                f"{photo_id} | {e['cluster']} | {e['cluster_confidence']:.2f} | {source_path}\n"
            )
    return len(flagged)


def main() -> None:
    # 1. Verify inputs exist
    if not _CATALOG_PATH.exists():
        print(
            f"Error: {_CATALOG_PATH} not found — run pipeline/ingest.py first.",
            file=sys.stderr,
        )
        sys.exit(1)
    if not _EMBEDDINGS_PATH.exists():
        print(
            f"Error: {_EMBEDDINGS_PATH} not found — run pipeline/embed.py first.",
            file=sys.stderr,
        )
        sys.exit(1)

    # 2. Load config
    config = _load_config()
    time_windows = config["pipeline"]["events"]["time_windows"]
    threshold = float(config["pipeline"].get("confidence_threshold", 0.7))

    # 3. Validate time_windows covers all ORDERED_CLUSTERS
    missing = [c for c in ORDERED_CLUSTERS if c not in time_windows]
    if missing:
        print(
            f"Error: config.yaml time_windows missing clusters: {missing}",
            file=sys.stderr,
        )
        sys.exit(1)

    # 4. Load catalog and embeddings
    with _CATALOG_PATH.open() as fh:
        catalog = json.load(fh)
    embeddings = np.load(_EMBEDDINGS_PATH)

    # 5. Assert shape alignment
    assert embeddings.shape == (len(catalog), 512), (
        f"Shape mismatch: embeddings {embeddings.shape} vs catalog length {len(catalog)}"
    )

    print(f"Loaded {len(catalog)} catalog entries, embeddings shape={embeddings.shape}")

    # 6. First pass — assign digital photos by EXIF timestamp
    for entry in catalog:
        if entry.get("has_exif") and entry.get("timestamp") is not None:
            dt = datetime.fromisoformat(entry["timestamp"])
            cluster, conf = assign_cluster_by_time(dt, time_windows)
            entry["_cluster"] = cluster
            entry["_confidence"] = conf

    # 7. Build centroids from high-confidence digital photos (confidence == 1.0)
    digi_indices = [e["embed_index"] for e in catalog if e.get("_confidence") == 1.0]
    digi_labels = [e["_cluster"] for e in catalog if e.get("_confidence") == 1.0]
    print(f"Building centroids from {len(digi_indices)} high-confidence EXIF photos...")
    centroids = compute_centroids(embeddings[digi_indices], digi_labels)
    print(f"  Centroids computed for clusters: {list(centroids.keys())}")

    # 8. Second pass — film photos via KNN
    film_entries = [e for e in catalog if not e.get("_confidence")]
    if len(film_entries) > 0 and len(centroids) == 0:
        print(
            "Error: no centroids available to assign film photos — "
            "ensure digital photos with EXIF timestamps exist.",
            file=sys.stderr,
        )
        sys.exit(1)

    if film_entries:
        film_indices = [e["embed_index"] for e in film_entries]
        film_embs = embeddings[film_indices]
        film_results = assign_film_photos(film_embs, centroids)
        for entry, (cluster, conf) in zip(film_entries, film_results):
            entry["_cluster"] = cluster
            entry["_confidence"] = conf
        print(f"Assigned {len(film_entries)} film photos via KNN.")

    # 9. Build metadata.json entries
    photos: list[dict] = []
    for entry in catalog:
        photos.append({
            "id": entry["id"],
            "filename": f"{entry['id']}.jpg",
            "r2_url": "",
            "thumb_url": "",
            "photographer": entry["photographer"],
            "timestamp": entry.get("timestamp"),
            "cluster": entry["_cluster"],
            "cluster_confidence": round(entry["_confidence"], 4),
            "faces": [],
        })

    metadata = {"photos": photos, "people": []}

    # 10. Write metadata.json
    _METADATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    with _METADATA_PATH.open("w", encoding="utf-8") as fh:
        json.dump(metadata, fh, indent=2, ensure_ascii=False)
    print(f"\nWrote {_METADATA_PATH} ({len(photos)} photos)")

    # 11. Write low_confidence.txt
    lc_entries = [
        {
            "id": e["id"],
            "cluster": e["_cluster"],
            "cluster_confidence": e["_confidence"],
            "source_path": e.get("source_path", ""),
        }
        for e in catalog
    ]
    flagged_count = write_low_confidence_report(lc_entries, _LOW_CONF_PATH, threshold)
    print(f"Wrote {_LOW_CONF_PATH} ({flagged_count} low-confidence entries flagged)")

    # 12. Summary
    print("\n--- Cluster Distribution ---")
    cluster_counts: dict[str, int] = {}
    for p in photos:
        cluster_counts[p["cluster"]] = cluster_counts.get(p["cluster"], 0) + 1
    for cluster in ORDERED_CLUSTERS:
        count = cluster_counts.get(cluster, 0)
        print(f"  {cluster}: {count}")
    print(f"\nTotal: {len(photos)} photos | Low-confidence (<{threshold}): {flagged_count}")


if __name__ == "__main__":
    main()
