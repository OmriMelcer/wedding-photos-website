# Phase 2: Pipeline Processing - Pattern Map

**Mapped:** 2026-05-16
**Files analyzed:** 8 (4 pipeline scripts, 1 config addition, 1 intermediate artifact, 4 test files)
**Analogs found:** 8 / 8 — all from `pipeline/acquire_google.py` (primary) and `pipeline/acquire_pictime.py` (supporting)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `pipeline/ingest.py` | pipeline script | file-I/O + transform | `pipeline/acquire_google.py` | role-match (same stage pattern, different I/O) |
| `pipeline/embed.py` | pipeline script | batch + file-I/O | `pipeline/acquire_google.py` | role-match |
| `pipeline/cluster.py` | pipeline script | transform + file-I/O | `pipeline/acquire_google.py` | role-match |
| `pipeline/resize.py` | pipeline script | file-I/O + transform | `pipeline/acquire_google.py` | role-match |
| `pipeline/config.yaml` | config | — | `pipeline/config.yaml` (self — add events section) | exact |
| `pipeline/output/catalog.json` | artifact | — | no analog — new intermediate format | no analog |
| `pipeline/output/embeddings.npy` | artifact | — | no analog — binary ML output | no analog |
| `pipeline/tests/__init__.py` | test | — | no analog — directory init | no analog |
| `pipeline/tests/conftest.py` | test config | — | no analog — first test file | no analog |
| `pipeline/tests/test_ingest.py` | test | — | no analog — first test file | no analog |
| `pipeline/tests/test_embed.py` | test | — | no analog — first test file | no analog |
| `pipeline/tests/test_cluster.py` | test | — | no analog — first test file | no analog |
| `pipeline/tests/test_resize.py` | test | — | no analog — first test file | no analog |

## Pattern Assignments

### `pipeline/ingest.py` (pipeline script, file-I/O + transform)

**Analog:** `pipeline/acquire_google.py`

**Module docstring pattern** (acquire_google.py lines 1-15):
```python
"""pipeline/ingest.py

Walk source folders from config.yaml, extract EXIF metadata, assign photographer
labels, and write pipeline/output/catalog.json.

Usage:
    uv run python pipeline/ingest.py

Dependencies:
    pillow   (EXIF extraction, image open)
    pyyaml   (config parsing)
"""
```

**Imports pattern** (acquire_google.py lines 17-24):
```python
from __future__ import annotations

import sys
from pathlib import Path

import yaml
```
Add for ingest.py:
```python
from __future__ import annotations

import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import yaml
from PIL import Image
from PIL.ExifTags import TAGS
```

**Path anchor pattern** (acquire_google.py lines 27-29):
```python
_SCRIPT_DIR = Path(__file__).resolve().parent
_CONFIG_PATH = _SCRIPT_DIR / "config.yaml"
_PROJECT_ROOT = _SCRIPT_DIR.parent
```
Add for ingest.py:
```python
_OUTPUT_DIR = _PROJECT_ROOT / "pipeline" / "output"
```

**Config load pattern** (acquire_google.py lines 32-38):
```python
def _load_config() -> dict:
    """Load and return the parsed pipeline/config.yaml."""
    if not _CONFIG_PATH.exists():
        print(f"Error: config file not found at {_CONFIG_PATH}", file=sys.stderr)
        sys.exit(1)
    with _CONFIG_PATH.open() as fh:
        return yaml.safe_load(fh)
```

**Path traversal guard pattern** (acquire_google.py lines 41-58):
```python
def _resolve_output_dir(output_dir_str: str) -> Path:
    """Resolve output_dir to an absolute path anchored at the project root.

    Applies path traversal mitigation: asserts the resolved path is
    a descendant of the project root before use.
    """
    resolved = (_PROJECT_ROOT / output_dir_str).resolve()
    project_root_resolved = _PROJECT_ROOT.resolve()
    if resolved != project_root_resolved and not str(resolved).startswith(
        str(project_root_resolved) + "/"
    ):
        print(
            f"Error: output_dir '{output_dir_str}' resolves outside the project root "
            f"({project_root_resolved}). Refusing to use it (path traversal guard).",
            file=sys.stderr,
        )
        sys.exit(1)
    return resolved
```
Apply the same guard to `_OUTPUT_DIR` resolution in ingest.py.

**Image file counting / source enumeration pattern** (acquire_google.py lines 61-64):
```python
def _count_images(directory: Path) -> int:
    """Return the number of image files in *directory* (non-recursive)."""
    image_files = list(directory.glob("*.[jJpPgG][pPeEnNiI][gGfFfF]*"))
    return len(image_files)
```
Reuse this glob pattern in ingest.py to enumerate source images.

**main() entry point pattern** (acquire_google.py lines 67-133):
```python
def main() -> None:
    config = _load_config()

    albums: list[dict] = config.get("sources", {}).get("google_photos", [])
    if not albums:
        print("Error: no entries found under sources.google_photos in config.yaml", file=sys.stderr)
        sys.exit(1)

    # ... process loop ...

    # --- Summary ---
    print(f"\nSummary: {len(processed)} album(s) downloaded.")
    for label, output_dir in processed:
        count = _count_images(output_dir)
        print(f"  {label}: {count} image file(s) in {output_dir}")


if __name__ == "__main__":
    main()
```
ingest.py reads `config.get("sources", {}).get("local_sources", [])` instead of `google_photos`.

**Error handling pattern** (acquire_google.py lines 117-124):
```python
if result.returncode != 0:
    stderr_text = result.stderr.decode(errors="replace")
    print(
        f"Error: gallery-dl failed for album '{label}' (exit code {result.returncode}).",
        file=sys.stderr,
    )
    sys.exit(1)
```
ingest.py uses the same `print(..., file=sys.stderr); sys.exit(1)` pattern for fatal errors.

**EXIF extraction pattern** (from RESEARCH.md Pattern 1 — no codebase analog exists yet):
```python
ISRAEL_TZ = timezone(timedelta(hours=2))
EXIF_DATETIME_FORMAT = "%Y:%m:%d %H:%M:%S"

TAG_MAP = {v: k for k, v in TAGS.items()}
DT_ORIGINAL_TAG = TAG_MAP["DateTimeOriginal"]       # 36867
OFFSET_ORIGINAL_TAG = TAG_MAP["OffsetTimeOriginal"]  # 36881

def extract_timestamp(img_path: pathlib.Path) -> datetime | None:
    """Return a TZ-aware datetime in Israel time (GMT+02:00), or None if no EXIF."""
    img = Image.open(img_path)
    exif = img._getexif() or {}
    raw_dt = exif.get(DT_ORIGINAL_TAG)
    if not raw_dt or not raw_dt.strip():
        return None
    dt_naive = datetime.strptime(raw_dt, EXIF_DATETIME_FORMAT)
    offset_str = exif.get(OFFSET_ORIGINAL_TAG, "").strip()
    if offset_str and offset_str not in ("+00:00", "00:00", ""):
        sign = 1 if offset_str[0] == "+" else -1
        h, m = int(offset_str[1:3]), int(offset_str[4:6])
        cam_tz = timezone(timedelta(hours=sign * h, minutes=sign * m))
        dt_aware = dt_naive.replace(tzinfo=cam_tz)
    else:
        dt_aware = dt_naive.replace(tzinfo=ISRAEL_TZ)
    return dt_aware.astimezone(ISRAEL_TZ)
```
Key: `+00:00` offsets are treated as misconfigured (Israel local time), not UTC. `+03:00` is also treated as local. See RESEARCH.md Pitfalls 1 and 5.

**Photo ID generation pattern** (from RESEARCH.md — no codebase analog):
```python
# Use folder label as prefix to avoid cross-folder collisions
photo_id = f"{label}_{img_path.stem}"  # e.g. "abir_sultan_ABR50001"
```

**catalog.json write pattern**:
```python
_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
catalog_path = _OUTPUT_DIR / "catalog.json"
with catalog_path.open("w", encoding="utf-8") as fh:
    json.dump(catalog, fh, indent=2, default=str)
print(f"Wrote {len(catalog)} entries to {catalog_path}")
```

---

### `pipeline/embed.py` (pipeline script, batch + file-I/O)

**Analog:** `pipeline/acquire_google.py`

**Module docstring pattern** (acquire_google.py lines 1-15):
```python
"""pipeline/embed.py

Compute CLIP ViT-B/32 embeddings for all photos in pipeline/output/catalog.json.
Writes pipeline/output/embeddings.npy (N×512 float32, L2-normalized).

Usage:
    uv run python pipeline/embed.py

Dependencies:
    open-clip-torch  (CLIP model + preprocessing)
    torch            (inference)
    numpy            (array save)
    pillow           (image open)
"""
```

**Imports pattern** (acquire_google.py lines 17-24 as base):
```python
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import open_clip
import torch
import yaml
from PIL import Image, ImageFilter
```

**Path anchor and config load** — copy exactly from acquire_google.py lines 27-38. Add:
```python
_CATALOG_PATH = _PROJECT_ROOT / "pipeline" / "output" / "catalog.json"
_EMBEDDINGS_PATH = _PROJECT_ROOT / "pipeline" / "output" / "embeddings.npy"
```

**No module-level singletons** (per CLAUDE.md constraint): Load the CLIP model inside `main()`, not at module import. Pattern from acquire_google.py where `config = _load_config()` is called inside `main()`.

**CLIP model load + embed pattern** (from RESEARCH.md Pattern 3):
```python
def load_clip_model():
    model, _, preprocess = open_clip.create_model_and_transforms(
        "ViT-B-32", pretrained="openai"
    )
    model.eval()
    return model, preprocess

def embed_image(img_path: Path, model, preprocess, device="cpu") -> np.ndarray:
    """Return L2-normalized 512-dim embedding."""
    img = Image.open(img_path).convert("RGB")
    img.thumbnail((512, 512), Image.Resampling.LANCZOS)
    img = img.filter(ImageFilter.GaussianBlur(radius=1))
    tensor = preprocess(img).unsqueeze(0).to(device)
    with torch.no_grad():
        features = model.encode_image(tensor)
        features = features / features.norm(dim=-1, keepdim=True)
    return features.cpu().numpy()[0]  # shape: (512,)
```

**Progress print pattern** (acquire_google.py lines 104, 132-133):
```python
print(f"Embedding {i+1}/{len(catalog)}: {entry['id']} ...")
# ...
print(f"\nWrote embeddings.npy — shape {embeddings.shape}")
```

**Embeddings save pattern**:
```python
embeddings = np.stack(all_embeddings).astype(np.float32)
np.save(_EMBEDDINGS_PATH, embeddings)
```

**main() entry point pattern** (acquire_google.py lines 136-137):
```python
if __name__ == "__main__":
    main()
```

**Error handling**: Use `print(..., file=sys.stderr); sys.exit(1)` for fatal errors (catalog not found, etc.). Same as acquire_google.py lines 35-37.

---

### `pipeline/cluster.py` (pipeline script, transform + file-I/O)

**Analog:** `pipeline/acquire_google.py`

**Module docstring pattern**:
```python
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
```

**Imports**:
```python
from __future__ import annotations

import json
import sys
from datetime import time
from pathlib import Path

import numpy as np
import yaml
from sklearn.neighbors import NearestNeighbors
```

**Path anchor + config load** — copy exactly from acquire_google.py lines 27-38. Add:
```python
_CATALOG_PATH = _PROJECT_ROOT / "pipeline" / "output" / "catalog.json"
_EMBEDDINGS_PATH = _PROJECT_ROOT / "pipeline" / "output" / "embeddings.npy"
_METADATA_PATH = _PROJECT_ROOT / "pipeline" / "output" / "metadata.json"
_LOW_CONF_PATH = _PROJECT_ROOT / "pipeline" / "output" / "low_confidence.txt"
```

**Time-window cluster assignment pattern** (from RESEARCH.md Pattern 2):
```python
ORDERED_CLUSTERS = ["prep", "photoshooting", "dining", "hupa", "dancing"]

def assign_cluster_by_time(dt_israel, time_windows: dict) -> tuple[str, float]:
    """Return (cluster_label, confidence). EXIF assignments get confidence=1.0."""
    t = dt_israel.time()
    for cluster in ORDERED_CLUSTERS:
        window = time_windows[cluster]
        start = time.fromisoformat(window["start"])
        end = time.fromisoformat(window["end"])
        if start <= t < end:
            return cluster, 1.0
    # Outside all windows — assign to nearest boundary cluster
    return _nearest_cluster(t, time_windows), 0.5
```

**Centroid + KNN pattern** (from RESEARCH.md Pattern 4):
```python
def compute_centroids(embeddings: np.ndarray, labels: list[str]) -> dict[str, np.ndarray]:
    centroids = {}
    for cluster in ORDERED_CLUSTERS:
        mask = np.array([l == cluster for l in labels])
        if mask.sum() == 0:
            continue
        centroid = embeddings[mask].mean(axis=0)
        centroid /= np.linalg.norm(centroid)
        centroids[cluster] = centroid
    return centroids

def assign_film_photos(film_embeddings: np.ndarray, centroids: dict) -> list[tuple[str, float]]:
    centroid_matrix = np.stack([centroids[c] for c in ORDERED_CLUSTERS if c in centroids])
    centroid_labels = [c for c in ORDERED_CLUSTERS if c in centroids]
    nn = NearestNeighbors(n_neighbors=1, metric="cosine", algorithm="brute")
    nn.fit(centroid_matrix)
    distances, indices = nn.kneighbors(film_embeddings)
    results = []
    for dist, idx in zip(distances[:, 0], indices[:, 0]):
        cluster = centroid_labels[idx]
        confidence = float(1.0 - dist)
        results.append((cluster, confidence))
    return results
```

**metadata.json write pattern** — every photo entry must include `"faces": []`:
```python
photo_entry = {
    "id": entry["id"],
    "filename": f"{entry['id']}.jpg",
    "r2_url": "",          # filled in by upload.py
    "thumb_url": "",       # filled in by upload.py
    "photographer": entry["photographer"],
    "timestamp": entry["timestamp"],
    "cluster": cluster,
    "cluster_confidence": round(confidence, 4),
    "faces": [],
}
```

**Low-confidence file write pattern** (from RESEARCH.md Code Examples):
```python
with _LOW_CONF_PATH.open("w", encoding="utf-8") as fh:
    fh.write("# Generated by cluster.py — review before upload\n")
    fh.write("# Format: photo_id | assigned_cluster | confidence | source_path\n")
    for entry in low_conf_entries:
        fh.write(f"{entry['id']} | {entry['cluster']} | {entry['confidence']:.2f} | {entry['source_path']}\n")
```

**Summary print pattern** (acquire_google.py lines 129-133):
```python
print(f"\nCluster assignment complete: {len(photos)} photos")
for cluster in ORDERED_CLUSTERS:
    count = sum(1 for p in photos if p["cluster"] == cluster)
    print(f"  {cluster}: {count} photo(s)")
print(f"Low-confidence (< {threshold}): {len(low_conf_entries)} — see {_LOW_CONF_PATH}")
```

---

### `pipeline/resize.py` (pipeline script, file-I/O + transform)

**Analog:** `pipeline/acquire_google.py`

**Module docstring pattern**:
```python
"""pipeline/resize.py

Resize photos to web quality and generate thumbnails.
Reads pipeline/output/metadata.json for photo IDs and source paths.
Writes pipeline/output/photos/*.jpg and pipeline/output/thumbs/*.jpg.

Usage:
    uv run python pipeline/resize.py

Dependencies:
    pillow  (EXIF transpose, resize, JPEG save)
"""
```

**Imports**:
```python
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageOps
```

**Path anchor + output dirs**:
```python
_SCRIPT_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _SCRIPT_DIR.parent
_METADATA_PATH = _PROJECT_ROOT / "pipeline" / "output" / "metadata.json"
_PHOTOS_DIR = _PROJECT_ROOT / "pipeline" / "output" / "photos"
_THUMBS_DIR = _PROJECT_ROOT / "pipeline" / "output" / "thumbs"

WEB_MAX = 2000
THUMB_MAX = 400
JPEG_QUALITY = 82
JPEG_OPTIMIZE = True
```

**Resize + thumbnail pattern** (from RESEARCH.md Pattern 5):
```python
def resize_photo(src: Path, web_out: Path, thumb_out: Path) -> None:
    img = Image.open(src)
    img = ImageOps.exif_transpose(img)  # Correct orientation before resize
    img = img.convert("RGB")            # No alpha channel in JPEG

    # Web image — work on a copy so thumbnail() doesn't modify the base
    web = img.copy()
    web.thumbnail((WEB_MAX, WEB_MAX), Image.Resampling.LANCZOS)
    web.save(web_out, format="JPEG", quality=JPEG_QUALITY, optimize=JPEG_OPTIMIZE)

    # Thumbnail
    thumb = img.copy()
    thumb.thumbnail((THUMB_MAX, THUMB_MAX), Image.Resampling.LANCZOS)
    thumb.save(thumb_out, format="JPEG", quality=JPEG_QUALITY, optimize=JPEG_OPTIMIZE)
```
Critical: call `img.copy()` before each `thumbnail()` call — `thumbnail()` modifies in-place (RESEARCH.md Anti-Patterns).

**Progress + summary print** (acquire_google.py lines 104, 129-133):
```python
print(f"Resizing {i+1}/{total}: {photo_id} ...")
# ...
print(f"\nResize complete: {total} photos → {_PHOTOS_DIR}, {total} thumbs → {_THUMBS_DIR}")
```

**main() entry point** (acquire_google.py lines 136-137):
```python
if __name__ == "__main__":
    main()
```

---

### `pipeline/config.yaml` (config — add events section)

**Self-analog:** Current `pipeline/config.yaml` (lines 1-47). Add the following block under the `pipeline:` key:

```yaml
events:
  time_windows:
    prep:
      start: "08:00"
      end: "14:00"
    photoshooting:
      start: "14:00"
      end: "16:10"
    dining:
      start: "16:10"
      end: "18:00"
    hupa:
      start: "18:00"
      end: "18:40"
    dancing:
      start: "18:40"
      end: "23:59"
```

Cluster names: `prep`, `photoshooting`, `dining`, `hupa`, `dancing` — note RESEARCH.md uses `dancing` not `party` (the CLAUDE.md spec mentions `party`; RESEARCH.md uses `dancing` throughout based on actual EXIF cluster discovery). Confirm with user before writing cluster.py if discrepancy matters.

---

### `pipeline/tests/conftest.py` (test fixtures — no analog)

No existing pytest fixtures in the codebase. Use RESEARCH.md guidance:

```python
"""Shared pytest fixtures for pipeline tests."""
from __future__ import annotations

import io
import struct
from pathlib import Path

import numpy as np
import pytest
from PIL import Image


@pytest.fixture()
def tiny_jpeg(tmp_path: Path) -> Path:
    """A 10×10 white JPEG with no EXIF, written to tmp_path."""
    img = Image.new("RGB", (10, 10), color=(255, 255, 255))
    out = tmp_path / "fixture.jpg"
    img.save(out, format="JPEG")
    return out


@pytest.fixture()
def fixture_embeddings() -> np.ndarray:
    """5 L2-normalized random embeddings (N=5, dim=512). No model needed."""
    rng = np.random.default_rng(42)
    arr = rng.standard_normal((5, 512)).astype(np.float32)
    norms = np.linalg.norm(arr, axis=1, keepdims=True)
    return arr / norms


@pytest.fixture()
def fixture_config() -> dict:
    """Minimal config dict matching pipeline/config.yaml structure."""
    return {
        "pipeline": {
            "confidence_threshold": 0.7,
            "events": {
                "time_windows": {
                    "prep":          {"start": "08:00", "end": "14:00"},
                    "photoshooting": {"start": "14:00", "end": "16:10"},
                    "dining":        {"start": "16:10", "end": "18:00"},
                    "hupa":          {"start": "18:00", "end": "18:40"},
                    "dancing":       {"start": "18:40", "end": "23:59"},
                }
            },
        }
    }
```

---

### `pipeline/tests/test_ingest.py` (unit tests — no analog)

Test structure pattern (from RESEARCH.md Validation section):
```python
"""Unit tests for pipeline/ingest.py — covers PIPE-01, PIPE-02."""
from __future__ import annotations

from datetime import datetime, timezone, timedelta

import pytest

# Import functions directly — do not invoke main()
from pipeline.ingest import extract_timestamp, assign_photographer_label


ISRAEL_TZ = timezone(timedelta(hours=2))


def test_exif_normalization(tmp_path):
    """PIPE-01: DateTimeOriginal extracted and normalized to GMT+02:00."""
    # ...


def test_zero_offset_treated_as_local(tmp_path):
    """PIPE-01: +00:00 offset treated as Israel local time, not UTC."""
    # ...


def test_photographer_label(fixture_config):
    """PIPE-02: Photographer label assigned from config.yaml source entry."""
    # ...
```

Key rule from RESEARCH.md: mock `open_clip.create_model_and_transforms` in `test_embed.py` — do not download the model in tests.

---

### `pipeline/tests/test_embed.py` (unit tests — no analog)

```python
"""Unit tests for pipeline/embed.py — covers PIPE-03."""
from __future__ import annotations
from unittest.mock import patch, MagicMock

import numpy as np
import pytest


def test_embedding_shape_normalized(tiny_jpeg):
    """PIPE-03: Embedding shape is (512,) and L2-norm ≈ 1.0."""
    fixed_embedding = np.ones(512, dtype=np.float32)
    fixed_embedding /= np.linalg.norm(fixed_embedding)

    mock_model = MagicMock()
    mock_features = MagicMock()
    mock_features.norm.return_value = MagicMock()
    # ... patch open_clip.create_model_and_transforms
    # Assert result.shape == (512,)
    # Assert abs(np.linalg.norm(result) - 1.0) < 1e-5
```

---

## Shared Patterns

### Script Skeleton (all four pipeline scripts)
**Source:** `pipeline/acquire_google.py` (entire file)
**Apply to:** `ingest.py`, `embed.py`, `cluster.py`, `resize.py`

Every script follows this exact skeleton:
1. Module docstring with Usage + Dependencies
2. `from __future__ import annotations`
3. stdlib imports (alphabetical), then third-party imports
4. `_SCRIPT_DIR`, `_CONFIG_PATH`, `_PROJECT_ROOT` constants (lines 27-29)
5. Private helper functions prefixed with `_`
6. `main() -> None:` with all processing logic
7. `if __name__ == "__main__": main()`

### Config Load
**Source:** `pipeline/acquire_google.py` lines 32-38
**Apply to:** `ingest.py`, `embed.py`, `cluster.py`, `resize.py`

All scripts use `_load_config()` returning `yaml.safe_load(fh)`. Config section access uses `.get()` with empty defaults to avoid KeyError.

### Path Traversal Guard
**Source:** `pipeline/acquire_google.py` lines 41-58
**Apply to:** `ingest.py` (for source dirs), `resize.py` (for output dirs)

The `_resolve_output_dir()` function is the established security pattern. Any path derived from config.yaml must pass through this guard before use.

### Error Handling
**Source:** `pipeline/acquire_google.py` lines 35-37, 119-124
**Apply to:** `ingest.py`, `embed.py`, `cluster.py`, `resize.py`

Fatal errors use:
```python
print(f"Error: <message>", file=sys.stderr)
sys.exit(1)
```
Non-fatal warnings use:
```python
print(f"Warning: <message>", file=sys.stderr)
```
No exceptions are raised to the top level — all errors are caught and converted to `sys.exit(1)`.

### Progress Printing
**Source:** `pipeline/acquire_google.py` lines 104, 129-133 (`acquire_pictime.py` lines 80, 111, 124)
**Apply to:** `ingest.py`, `embed.py`, `cluster.py`, `resize.py`

Pattern:
- Per-item: `print(f"Processing {i+1}/{total}: {item_id} ...")`  (no trailing newline, to stdout)
- Summary at end: `print(f"\nSummary: {n} items processed.")`

### Source Image Enumeration
**Source:** `pipeline/acquire_google.py` lines 61-64 + `acquire_pictime.py` line 28
**Apply to:** `ingest.py`

```python
IMAGE_GLOB = "*.[jJpPgG][pPeEnNiI][gGfFfF]*"

def _count_images(directory: Path) -> int:
    return len(list(directory.glob(IMAGE_GLOB)))
```

Use `sorted(directory.glob(IMAGE_GLOB))` in ingest.py to ensure deterministic ordering across runs.

### Output Directory Creation
**Source:** `pipeline/acquire_pictime.py` line 129 + `acquire_google.py` line 105
**Apply to:** `ingest.py`, `embed.py`, `cluster.py`, `resize.py`

```python
output_dir.mkdir(parents=True, exist_ok=True)
```
Call this before any write. Each script is responsible for creating its own output paths.

### Missing Source Directory Handling
**Source:** `pipeline/acquire_google.py` lines 75-95 (PLACEHOLDER check) adapted for file existence
**Apply to:** `ingest.py`

Per RESEARCH.md Open Question 2 (pic_time not yet downloaded): skip missing source directories with a warning rather than exiting:
```python
if not source_dir.exists():
    print(f"Warning: source directory '{source_dir}' not found — skipping.", file=sys.stderr)
    continue
```

## No Analog Found

Files with no close match in the codebase (use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `pipeline/output/catalog.json` | artifact | — | New intermediate schema; no existing JSON catalog in codebase |
| `pipeline/output/embeddings.npy` | artifact | — | First ML binary output; no existing .npy files |
| `pipeline/tests/__init__.py` | init | — | No existing test directory |
| `pipeline/tests/conftest.py` | test config | — | No existing pytest fixtures |
| `pipeline/tests/test_ingest.py` | test | — | No existing tests |
| `pipeline/tests/test_embed.py` | test | — | No existing tests; must mock CLIP model |
| `pipeline/tests/test_cluster.py` | test | — | No existing tests; use fixture embeddings array |
| `pipeline/tests/test_resize.py` | test | — | No existing tests; use tiny fixture JPEG |

For all test files: use pytest convention. RESEARCH.md Validation section provides test names and assertions for each PIPE-0X requirement.

## Metadata

**Analog search scope:** `pipeline/` directory
**Files scanned:** `pipeline/acquire_google.py` (138 lines), `pipeline/acquire_pictime.py` (152 lines), `pipeline/config.yaml` (47 lines), `main.py` (6 lines)
**Pattern extraction date:** 2026-05-16
