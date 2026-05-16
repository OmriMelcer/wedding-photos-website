"""pipeline/reconcile_clusters.py

After manually reviewing and rearranging images in pipeline/review/{cluster}/,
run this script to update pipeline/output/metadata.json to match.

Usage:
    uv run python pipeline/reconcile_clusters.py [--dry-run]

What it does:
  1. Scans pipeline/review/{prep,photoshooting,dining,hupa,dancing}/ for .jpg files
  2. Matches each filename back to a metadata.json entry by id
  3. Updates the cluster field (and sets cluster_confidence=1.0 — manual = certain)
  4. Reports any files it couldn't match or any metadata entries missing from review/

Options:
    --dry-run   Print what would change without writing metadata.json
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ORDERED_CLUSTERS = ["prep", "photoshooting", "dining", "hupa", "dancing"]

_SCRIPT_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _SCRIPT_DIR.parent
_REVIEW_DIR = _PROJECT_ROOT / "pipeline" / "review"
_METADATA_PATH = _PROJECT_ROOT / "pipeline" / "output" / "metadata.json"


def main() -> None:
    dry_run = "--dry-run" in sys.argv

    if not _METADATA_PATH.exists():
        print(f"Error: {_METADATA_PATH} not found — run pipeline/cluster.py first.", file=sys.stderr)
        sys.exit(1)

    if not _REVIEW_DIR.exists():
        print(f"Error: {_REVIEW_DIR} not found.", file=sys.stderr)
        sys.exit(1)

    # Load current metadata
    with _METADATA_PATH.open() as fh:
        metadata = json.load(fh)
    photos = metadata["photos"]

    # Build lookup: filename → photo entry
    by_filename: dict[str, dict] = {p["filename"]: p for p in photos}

    # Scan review directories
    review_assignments: dict[str, str] = {}  # filename → cluster
    unrecognized: list[tuple[str, str]] = []  # (cluster_dir, filename)

    for cluster in ORDERED_CLUSTERS:
        cluster_dir = _REVIEW_DIR / cluster
        if not cluster_dir.exists():
            print(f"  Warning: review/{cluster}/ does not exist — skipping", file=sys.stderr)
            continue
        for jpg in cluster_dir.glob("*.jpg"):
            if jpg.name in by_filename:
                review_assignments[jpg.name] = cluster
            else:
                unrecognized.append((cluster, jpg.name))

    # Detect metadata entries missing from review/
    in_review = set(review_assignments.keys())
    all_filenames = set(by_filename.keys())
    missing_from_review = all_filenames - in_review

    # Compute diffs
    changes: list[tuple[str, str, str]] = []  # (filename, old_cluster, new_cluster)
    for filename, new_cluster in review_assignments.items():
        old_cluster = by_filename[filename]["cluster"]
        if old_cluster != new_cluster:
            changes.append((filename, old_cluster, new_cluster))

    # Report
    print(f"\nReconciliation report")
    print(f"{'(DRY RUN — no changes written)' if dry_run else ''}")
    print(f"  Total in review/: {len(review_assignments)}")
    print(f"  Changed cluster:  {len(changes)}")
    print(f"  Missing from review/: {len(missing_from_review)}")
    print(f"  Unrecognized files:   {len(unrecognized)}")

    if changes:
        print("\nCluster changes:")
        for filename, old, new in sorted(changes):
            photo_id = by_filename[filename]["id"]
            print(f"  {photo_id}: {old} → {new}")

    if missing_from_review:
        print("\nWarning — these photos are in metadata.json but not found in any review/ folder:")
        for f in sorted(missing_from_review):
            print(f"  {f}")

    if unrecognized:
        print("\nWarning — these files in review/ were not found in metadata.json:")
        for cluster, f in unrecognized:
            print(f"  review/{cluster}/{f}")

    if dry_run:
        print("\nDry run — metadata.json NOT updated.")
        return

    if not changes:
        print("\nNo cluster changes detected — metadata.json unchanged.")
        return

    # Apply changes
    for filename, _old, new_cluster in changes:
        entry = by_filename[filename]
        entry["cluster"] = new_cluster
        entry["cluster_confidence"] = 1.0  # manual override = certain

    with _METADATA_PATH.open("w", encoding="utf-8") as fh:
        json.dump(metadata, fh, indent=2, ensure_ascii=False)

    print(f"\n✓ metadata.json updated — {len(changes)} cluster(s) changed.")
    if missing_from_review:
        print("  Note: entries missing from review/ were left unchanged.")


if __name__ == "__main__":
    main()
