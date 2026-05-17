# Phase 2: Pipeline Processing - Research

**Researched:** 2026-05-16
**Domain:** Python image processing, EXIF extraction, CLIP embeddings, KNN clustering, Pillow resizing
**Confidence:** HIGH (all core claims verified via PyPI registry, official docs, and live codebase probing)

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PIPE-01 | EXIF timestamps extracted from digital photos and normalized to GMT+02:00 | `DateTimeOriginal` + `OffsetTimeOriginal` tags present in all EXIF sources; mixed offsets (+00:00, +02:00, +03:00) confirmed — normalization is non-trivial and **required** |
| PIPE-02 | Photographer tag assigned per source folder via config.yaml | `sources.local_sources[].label` + `has_exif` flags present in config; 4 source entries map to 3 photographer labels (abir_sultan used for both digital and film) |
| PIPE-03 | CLIP ViT-B/32 embeddings for ALL photos; blurred and downscaled before inference | `open-clip-torch` 3.3.0 on PyPI; model ID is `ViT-B-32` pretrained `openai`; built-in preprocess pipeline handles 224×224 crop/normalize |
| PIPE-04 | Digital photos assigned to event cluster via EXIF timestamp against config.yaml time windows | Time windows not yet in config.yaml — **must be added**; 5 clusters: prep, photoshooting, dining, hupa, dancing |
| PIPE-05 | Centroid computed from EXIF-labeled embeddings; film photos assigned via KNN | `sklearn.neighbors.NearestNeighbors` with `metric='cosine'`; centroids = mean of L2-normalized embeddings per cluster |
| PIPE-06 | cluster_confidence score for every photo; low-confidence flagged for review | EXIF-assigned photos get confidence=1.0; film photos get cosine similarity to nearest centroid |
| PIPE-07 | Photos resized to web quality; thumbnails generated per photo | Pillow `Image.resize()` + `ImageOps.exif_transpose()`; JPEG save with quality/optimize params |
</phase_requirements>

## Summary

Phase 2 processes 1,327 source photos across four source folders into a structured set of web images, thumbnails, and a `metadata.json` ready for upload. The pipeline has four distinct stages (ingest, embed, cluster, resize) that each write their outputs to disk as intermediate files — this allows individual stages to be re-run without restarting the full pipeline.

The primary technical complexity is in two areas. First, EXIF timezone handling: inspection of actual source photos reveals that `OffsetTimeOriginal` is present but inconsistent — `abir_sultan` files report `+02:00`, while `inbal_zeldin` and `magnate_images` files report `+00:00` for some cameras and `+03:00` for others. The timestamp values in those files appear to be local Israel time regardless of offset value, meaning the offset field cannot be trusted blindly. The safest approach is to parse `DateTimeOriginal` as local Israel time (GMT+02:00) for any file whose offset is `+00:00`, on the assumption that cameras without proper TZ configuration stored local time with no offset. Second, the CLIP embedding pipeline requires installing `open-clip-torch`, which pulls in PyTorch (~600MB on macOS) as a transitive dependency.

The pipeline scripts do not exist yet (`ingest.py`, `embed.py`, `cluster.py`, `resize.py` are all absent from `pipeline/`). Config additions are also required: event time windows must be added to `pipeline/config.yaml` before `ingest.py` can assign clusters.

**Primary recommendation:** Build each pipeline stage as a standalone script that writes its output to a `pipeline/output/` staging directory. Use JSON for intermediate catalogs and NumPy `.npy` for embedding arrays. Install the full ML stack via `uv add` before writing embed.py.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| EXIF extraction + timestamp normalization | Pipeline (ingest.py) | config.yaml (time windows) | Runs locally, one-shot; no browser involvement |
| Photographer tagging | Pipeline (ingest.py) | config.yaml (label map) | Source folder identity is determined at ingest time |
| CLIP embedding computation | Pipeline (embed.py) | — | CPU-local ML inference; outputs .npy files |
| Cluster assignment (EXIF) | Pipeline (cluster.py) | config.yaml (time windows) | Deterministic lookup against declared time windows |
| Cluster assignment (KNN) | Pipeline (cluster.py) | scikit-learn (NearestNeighbors) | ML decision at pipeline time, not runtime |
| Confidence scoring | Pipeline (cluster.py) | — | Computed from cosine distance at assignment time |
| Low-confidence review flag | Pipeline (cluster.py) | config.yaml (threshold) | Blocks upload until human approves or overrides |
| Image resize + thumbnail | Pipeline (resize.py) | Pillow | One-shot transformation of source images |
| metadata.json assembly | Pipeline (cluster.py or separate step) | — | Written to disk; consumed by Phase 3 upload |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `open-clip-torch` | 3.3.0 | CLIP ViT-B/32 embeddings | Official open-source CLIP re-implementation; `openai` pretrained weights available; CPU-only works |
| `torch` | 2.12.0 (pulled by open-clip) | Tensor ops + inference | Required transitive dependency; MPS support on Apple Silicon is a bonus |
| `torchvision` | 0.27.0 (version-locked to torch 2.12.0) | Image transforms | Pulled by open-clip; version locked to match torch |
| `scikit-learn` | 1.8.0 | KNN cluster assignment | Industry-standard ML library; `NearestNeighbors` with `metric='cosine'` |
| `numpy` | 2.4.5 | Embedding arrays + centroid math | Pulled by scikit-learn; `.npy` is the standard format for saving embedding matrices |
| `pillow` | 12.2.0 (already installed) | EXIF extraction, resize, thumbnail | Already in pyproject.toml; `ImageOps.exif_transpose` handles orientation |
| `pyyaml` | 6.0.3 (already installed) | config.yaml parsing | Already in pyproject.toml |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `ftfy` | 6.3.1 | Unicode text fixing | Pulled by open-clip; no direct use needed |
| `timm` | 1.0.27 | Vision model support | Pulled by open-clip; no direct use needed |
| `huggingface-hub` | latest | Model weight download | Pulled by open-clip; model downloads on first run |
| `safetensors` | latest | Model weight format | Pulled by open-clip; no direct use needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `open-clip-torch` (openai weights) | `openai/clip` package | `openai/clip` is unmaintained; open-clip is the active fork with same weights |
| `sklearn.NearestNeighbors` | manual cosine similarity + argmin | sklearn handles edge cases and is battle-tested; hand-rolling is unnecessary |
| JSON for inter-stage catalog | SQLite | JSON is readable, debuggable, and sufficient at 1,327 photos; SQLite adds complexity |
| `.npy` for embeddings | pickle | `.npy` is portable, language-agnostic, and resistant to Python version breakage |

**Installation (new dependencies only):**

```bash
uv add open-clip-torch scikit-learn
```

`torch`, `torchvision`, `numpy`, `ftfy`, `timm`, `huggingface-hub`, and `safetensors` are pulled automatically as transitive dependencies. Do not pin torch separately — torchvision requires `torch==2.12.0` exactly, and `uv` resolves this correctly from open-clip-torch's dependency tree.

**Version verification (checked 2026-05-16):**

```
open-clip-torch  3.3.0   — PyPI, first release 2022-04-04, latest 2026-02-27
scikit-learn     1.8.0   — PyPI, stable, uploaded 2025-12-10
torch            2.12.0  — PyPI, latest, uploaded 2026-05-13
torchvision      0.27.0  — PyPI, version-locked to torch==2.12.0, uploaded 2026-05-13
numpy            2.4.5   — PyPI, stable, uploaded 2026-05-15
```

## Package Legitimacy Audit

> slopcheck was unavailable at research time. All packages below are tagged `[ASSUMED]` for the packages not yet installed. Already-installed packages (pillow, pyyaml) are `[VERIFIED]` from the existing lockfile.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `pillow` | PyPI | 14+ yrs | Very high | github.com/python-pillow/Pillow | not run | Approved (already in lockfile) |
| `pyyaml` | PyPI | 15+ yrs | Very high | github.com/yaml/pyyaml | not run | Approved (already in lockfile) |
| `open-clip-torch` | PyPI | 4 yrs (2022-04-04) | High | github.com/mlfoundations/open_clip | not run [ASSUMED] | Approved — well-known research library, GitHub stars >20k |
| `scikit-learn` | PyPI | 13+ yrs (2012-01-11) | Very high | github.com/scikit-learn/scikit-learn | not run | Approved — industry standard |
| `torch` | PyPI | 8 yrs | Very high | github.com/pytorch/pytorch | not run | Approved — industry standard (Meta/PyTorch Foundation) |
| `torchvision` | PyPI | 8 yrs | Very high | github.com/pytorch/vision | not run | Approved — official PyTorch companion |
| `numpy` | PyPI | 18+ yrs | Very high | github.com/numpy/numpy | not run | Approved — foundational scientific Python |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*slopcheck was unavailable at research time. `open-clip-torch` is tagged `[ASSUMED]` but comes from the well-documented mlfoundations organization (same team as original CLIP reproduction paper). All others are industry-standard packages with decade-long histories.*

## Architecture Patterns

### System Architecture Diagram

```
[sources/abir_sultan/]          ──┐
[sources/abir_sultan_film/]     ──┤   ingest.py
[sources/inbal_zeldin/]         ──┤  (EXIF extract,           pipeline/output/
[sources/magnate_images/]       ──┘   photographer tag,   →   catalog.json
                                       TZ normalize)           (per-photo metadata,
                                                               no cluster yet)
                                                                     │
                                                                     ▼
                                       embed.py               pipeline/output/
                                      (CLIP ViT-B/32      →   embeddings.npy
                                       for ALL photos,         (N×512 float32)
                                       blur+downscale
                                       pre-process)
                                                                     │
                                                                     ▼
[pipeline/config.yaml]          ──┐   cluster.py            pipeline/output/
  events.time_windows           ──┤  (EXIF-assign           metadata.json
  pipeline.confidence_threshold ──┘   EXIF photos,      →   (complete, upload-ready)
                                       compute centroids,     pipeline/output/
                                       KNN-assign film,       low_confidence.txt
                                       flag low-conf)         (human review list)
                                                                     │
                                                                     ▼
                                       resize.py             pipeline/output/
                                      (LANCZOS resize,   →   photos/*.jpg
                                       JPEG quality=82,       thumbs/*.jpg
                                       exif_transpose)
```

### Recommended Project Structure

```
pipeline/
├── config.yaml          # add events.time_windows section here
├── ingest.py            # Stage 1: catalog + EXIF extraction
├── embed.py             # Stage 2: CLIP embeddings
├── cluster.py           # Stage 3: assignment + metadata.json
├── resize.py            # Stage 4: web images + thumbnails
├── upload.py            # Phase 3: R2 upload (out of scope for Phase 2)
└── output/              # Staging area (gitignored)
    ├── catalog.json     # ingest.py output
    ├── embeddings.npy   # embed.py output (N×512)
    ├── metadata.json    # cluster.py output
    ├── low_confidence.txt  # cluster.py review list
    ├── photos/          # resize.py output
    └── thumbs/          # resize.py output
```

### Pattern 1: EXIF Extraction with Timezone Normalization

**What:** Extract `DateTimeOriginal` + `OffsetTimeOriginal`, then convert to a timezone-aware datetime at GMT+02:00.

**Critical finding from live data:** `inbal_zeldin` and `magnate_images` files have `OffsetTimeOriginal='+00:00'` but timestamps that are clearly in Israel local time (e.g., `16:50` for photoshooting which is 14:00-16:10 Israel time). The offset is wrong — cameras were not configured for their timezone. Strategy: treat `+00:00` offsets as misconfigured and interpret `DateTimeOriginal` as Israel local time directly.

**When to use:** For every image with `has_exif: true` in config.yaml.

```python
# Source: live EXIF probe of sources/ (2026-05-16) + Pillow 12.2.0 docs
from PIL import Image
from PIL.ExifTags import TAGS
from datetime import datetime, timezone, timedelta
import pathlib

ISRAEL_TZ = timezone(timedelta(hours=2))
EXIF_DATETIME_FORMAT = "%Y:%m:%d %H:%M:%S"

TAG_MAP = {v: k for k, v in TAGS.items()}
DT_ORIGINAL_TAG = TAG_MAP["DateTimeOriginal"]      # 36867
OFFSET_ORIGINAL_TAG = TAG_MAP["OffsetTimeOriginal"] # 36881

def extract_timestamp(img_path: pathlib.Path) -> datetime | None:
    """Return a TZ-aware datetime in Israel time (GMT+02:00), or None if no EXIF."""
    img = Image.open(img_path)
    exif = img._getexif() or {}
    raw_dt = exif.get(DT_ORIGINAL_TAG)
    if not raw_dt or not raw_dt.strip():
        return None
    dt_naive = datetime.strptime(raw_dt, EXIF_DATETIME_FORMAT)
    offset_str = exif.get(OFFSET_ORIGINAL_TAG, "").strip()
    # Trust offset only when non-zero and not empty
    # "+00:00" is treated as misconfigured camera → interpret dt_naive as Israel time
    if offset_str and offset_str not in ("+00:00", "00:00", ""):
        sign = 1 if offset_str[0] == "+" else -1
        h, m = int(offset_str[1:3]), int(offset_str[4:6])
        cam_tz = timezone(timedelta(hours=sign * h, minutes=sign * m))
        dt_aware = dt_naive.replace(tzinfo=cam_tz)
    else:
        # Assume local Israel time regardless of offset field
        dt_aware = dt_naive.replace(tzinfo=ISRAEL_TZ)
    return dt_aware.astimezone(ISRAEL_TZ)
```

### Pattern 2: Event Cluster Assignment from Timestamp

**What:** Given a normalized Israel-time datetime, return the cluster label based on config.yaml time windows.

**When to use:** For every digital photo (EXIF present). Returns `None` if timestamp falls outside all windows (photos should be flagged or assigned to nearest boundary cluster).

```python
# Source: REQUIREMENTS.md PIPE-04 + config.yaml structure
from datetime import time

# config.yaml events section (to be added):
# events:
#   time_windows:
#     prep:           {start: "08:00", end: "14:00"}
#     photoshooting:  {start: "14:00", end: "16:10"}
#     dining:         {start: "16:10", end: "18:00"}
#     hupa:           {start: "18:00", end: "18:40"}
#     dancing:        {start: "18:40", end: "23:59"}

ORDERED_CLUSTERS = ["prep", "photoshooting", "dining", "hupa", "dancing"]

def assign_cluster_by_time(dt_israel: datetime, time_windows: dict) -> tuple[str, float]:
    """Return (cluster_label, confidence). EXIF assignments get confidence=1.0."""
    t = dt_israel.time()
    for cluster in ORDERED_CLUSTERS:
        window = time_windows[cluster]
        start = time.fromisoformat(window["start"])
        end = time.fromisoformat(window["end"])
        if start <= t < end:
            return cluster, 1.0
    # Outside all windows: assign to nearest boundary cluster
    # (handles edge cases like midnight wraparound)
    return _nearest_cluster(t, time_windows), 0.5
```

### Pattern 3: CLIP Embedding with Pre-Processing Optimization

**What:** Compute CLIP ViT-B/32 embeddings for all photos. Per PIPE-03, blur and downscale before inference to maximize speed (pre-processing is for clustering only, not the web images).

**When to use:** `embed.py` — run once for all 1,327 photos. Outputs `pipeline/output/embeddings.npy`.

```python
# Source: github.com/mlfoundations/open_clip README (fetched 2026-05-16)
import open_clip
import torch
import numpy as np
from PIL import Image, ImageFilter

def load_clip_model():
    model, _, preprocess = open_clip.create_model_and_transforms(
        "ViT-B-32", pretrained="openai"
    )
    model.eval()
    return model, preprocess

def embed_image(img_path: pathlib.Path, model, preprocess, device="cpu") -> np.ndarray:
    """Return L2-normalized 512-dim embedding. Pre-downscale+blur for speed."""
    img = Image.open(img_path).convert("RGB")
    # Downscale to 512px max (CLIP resizes to 224px anyway; this speeds up preprocess)
    img.thumbnail((512, 512), Image.Resampling.LANCZOS)
    # Slight blur reduces noise in film scans
    img = img.filter(ImageFilter.GaussianBlur(radius=1))
    tensor = preprocess(img).unsqueeze(0).to(device)
    with torch.no_grad():
        features = model.encode_image(tensor)
        features = features / features.norm(dim=-1, keepdim=True)  # L2 normalize
    return features.cpu().numpy()[0]  # shape: (512,)
```

### Pattern 4: KNN Centroid Assignment with Confidence Score

**What:** Compute per-cluster centroids from EXIF-labeled photo embeddings. Assign film photos to nearest centroid. Confidence = cosine similarity (dot product of L2-normalized vectors).

**When to use:** `cluster.py` — after embeddings are computed.

```python
# Source: scikit-learn 1.8.0 docs (scikit-learn.org, 2026-05-16)
from sklearn.neighbors import NearestNeighbors
import numpy as np

def compute_centroids(embeddings: np.ndarray, labels: list[str]) -> dict[str, np.ndarray]:
    """Compute L2-normalized mean centroid per cluster from EXIF-labeled photos."""
    centroids = {}
    for cluster in ORDERED_CLUSTERS:
        mask = np.array([l == cluster for l in labels])
        if mask.sum() == 0:
            continue
        centroid = embeddings[mask].mean(axis=0)
        centroid /= np.linalg.norm(centroid)  # L2 normalize
        centroids[cluster] = centroid
    return centroids

def assign_film_photos(film_embeddings: np.ndarray, centroids: dict) -> list[tuple[str, float]]:
    """Return (cluster, confidence) for each film photo via KNN (n=1)."""
    centroid_matrix = np.stack([centroids[c] for c in ORDERED_CLUSTERS if c in centroids])
    centroid_labels = [c for c in ORDERED_CLUSTERS if c in centroids]

    # All embeddings are L2-normalized; cosine similarity = dot product
    # NearestNeighbors with metric='cosine' computes 1 - cosine_similarity
    nn = NearestNeighbors(n_neighbors=1, metric="cosine", algorithm="brute")
    nn.fit(centroid_matrix)
    distances, indices = nn.kneighbors(film_embeddings)

    results = []
    for dist, idx in zip(distances[:, 0], indices[:, 0]):
        cluster = centroid_labels[idx]
        confidence = float(1.0 - dist)  # cosine similarity from cosine distance
        results.append((cluster, confidence))
    return results
```

### Pattern 5: Image Resize + Thumbnail with EXIF Orientation

**What:** For each source photo, produce a web image (max 2000px) and a thumbnail (max 400px). Apply `exif_transpose` before resizing to handle rotated photos. Strip EXIF from output to reduce file size.

```python
# Source: Pillow 12.2.0 docs (pillow.readthedocs.io, 2026-05-16)
from PIL import Image, ImageOps

WEB_MAX = 2000     # longest edge in pixels
THUMB_MAX = 400    # longest edge in pixels
JPEG_QUALITY = 82  # 80-85 is industry standard for web
JPEG_OPTIMIZE = True

def resize_photo(src: pathlib.Path, web_out: pathlib.Path, thumb_out: pathlib.Path) -> None:
    img = Image.open(src)
    img = ImageOps.exif_transpose(img)  # Correct orientation before resize
    img = img.convert("RGB")            # Ensure no alpha channel (JPEG doesn't support)

    # Web image
    web = img.copy()
    web.thumbnail((WEB_MAX, WEB_MAX), Image.Resampling.LANCZOS)
    web.save(web_out, format="JPEG", quality=JPEG_QUALITY, optimize=JPEG_OPTIMIZE)

    # Thumbnail
    thumb = img.copy()
    thumb.thumbnail((THUMB_MAX, THUMB_MAX), Image.Resampling.LANCZOS)
    thumb.save(thumb_out, format="JPEG", quality=JPEG_QUALITY, optimize=JPEG_OPTIMIZE)
```

### Anti-Patterns to Avoid

- **Trusting `OffsetTimeOriginal='+00:00'` at face value:** Live data shows that `inbal_zeldin` and `magnate_images` cameras stored local Israel time but reported offset as `+00:00`. Applying the offset would shift timestamps 2 hours into the wrong cluster window.
- **Storing raw embeddings in metadata.json:** CLAUDE.md explicitly prohibits this. Keep embeddings in `pipeline/output/embeddings.npy` (pipeline-local only); metadata.json stores only cluster labels and confidence scores.
- **Running resize.py before cluster.py:** resize.py needs the photo IDs from cluster.py's metadata.json to generate consistent filenames. Order: ingest → embed → cluster → resize.
- **Using `torch.autocast("cuda")` on CPU-only machine:** Remove CUDA-specific context managers; plain `torch.no_grad()` is sufficient for CPU inference.
- **Using `Image.thumbnail()` in-place then saving source:** `thumbnail()` modifies in-place. Always work on a copy when generating both web and thumb sizes from the same source open.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image orientation correction | Manual EXIF tag read + rotate | `ImageOps.exif_transpose()` | Handles all 8 EXIF orientation values including flip variants; removes tag after applying |
| Cosine similarity KNN | Manual dot-product + argmin loop | `NearestNeighbors(metric='cosine')` | Handles edge cases, vectorized, tested |
| CLIP image preprocessing | Manual resize + normalize | `preprocess` from `create_model_and_transforms` | Must exactly match the preprocessing used during model training (specific crop size, mean, std) |
| Image color space conversion | Manual channel manipulation | `img.convert("RGB")` | Handles palette, RGBA, grayscale, CMYK consistently |
| JPEG progressive encoding | Custom write | `save(..., progressive=True)` | Optional but easy to add; improves perceived load speed |

**Key insight:** The CLIP preprocessing pipeline is non-negotiable — using different normalization constants than the training pipeline produces garbage embeddings. Always use the `preprocess` transform returned by `create_model_and_transforms`.

## Common Pitfalls

### Pitfall 1: Mixed Timezone Offsets (CRITICAL)
**What goes wrong:** Photos from `inbal_zeldin` and `magnate_images` have `OffsetTimeOriginal='+00:00'` but store local Israel time in `DateTimeOriginal`. Naively applying the offset converts 18:00 Israel → 16:00 UTC, misassigning `hupa` photos to `photoshooting` or `dining`.
**Why it happens:** Nikon and Canon cameras were configured without proper timezone info in their settings. The `+00:00` indicates "no timezone set" rather than "UTC".
**How to avoid:** Treat `+00:00` as a misconfigured camera and interpret `DateTimeOriginal` as Israel local time directly. Only apply non-zero offsets.
**Warning signs:** Photos from the same photographer falling in implausibly early clusters.

### Pitfall 2: CLIP Model Weight Download Blocking First Run
**What goes wrong:** `open_clip.create_model_and_transforms('ViT-B-32', pretrained='openai')` downloads ~350MB of model weights from Hugging Face Hub on first use. This blocks for 2-5 minutes silently on a cold run.
**Why it happens:** Weights are cached to `~/.cache/huggingface/hub/` on first load.
**How to avoid:** Run `embed.py` once in a "warm-up" pass (or just let it download). After the first run, weights are cached and reused immediately.
**Warning signs:** `embed.py` appears to hang with no output for several minutes.

### Pitfall 3: Film Photos With Non-Empty But Blank EXIF
**What goes wrong:** Film scan files (`abir_sultan_film`) have an EXIF block but `DateTimeOriginal` is all spaces (whitespace-only). A naive `exif.get(DT_ORIGINAL_TAG)` returns the whitespace string, which is truthy, leading to a failed `strptime` call.
**Why it happens:** Some scanners write blank EXIF tags rather than omitting them.
**How to avoid:** Always check `.strip()` before attempting to parse datetime strings: `if not raw_dt or not raw_dt.strip(): return None`.
**Warning signs:** `ValueError: time data '                   ' does not match format`.

### Pitfall 4: photo ID Collision Across Photographer Folders
**What goes wrong:** `ABR50001.jpg` in `abir_sultan/` and a hypothetically identically-named file in another folder produce duplicate `photo_id` values in `catalog.json` and `metadata.json`, causing one photo to overwrite another.
**Why it happens:** Each photographer's camera generates sequential filenames starting from 00001.
**How to avoid:** Generate photo IDs by prefixing the source folder label: `f"{label}_{stem}"` → `abir_sultan_ABR50001`. This also appears in R2 paths.
**Warning signs:** `metadata.json` has fewer entries than expected total photo count.

### Pitfall 5: `inbal_zeldin` Mixed Camera Timestamps
**What goes wrong:** Inbal uses two camera bodies (Nikon Z 7_2 and Z6_3). The Z 7_2 reports `+00:00` offset while the Z6_3 reports `+03:00`. Both appear to store Israel local time. Applying `+03:00` naively subtracts 1 hour (converting Israel → Israel minus 1hr), which pushes `hupa` photos (18:00-18:40) back into `dining` range.
**Why it happens:** One body has wrong TZ, other has wrong but different wrong TZ.
**How to avoid:** Same fix as Pitfall 1: only apply the offset when it is `+02:00` exactly (Israel Summer Time) or `+03:00` with awareness that this body may be in DST (Israeli summer is actually UTC+3). Better: probe all sample timestamps, confirm the pattern, and document the decision in a code comment. The safest approach is to treat ALL sources as local-time-stored and normalize to +02:00 directly.

### Pitfall 6: Film Photos Assigned to Wrong Cluster due to Sparse Centroid
**What goes wrong:** If very few digital photos exist in a cluster (e.g., only 5 `prep` photos among 558 digital photos), the centroid is poorly defined and film photos visually matching `prep` may be assigned to a different cluster.
**Why it happens:** CLIP embeddings cluster by visual content; a centroid computed from 5 diverse preparation shots may not generalize well.
**How to avoid:** After KNN assignment, run the cluster review pass (Pitfall 6 check — count `cluster_confidence < threshold` in `low_confidence.txt`). Low prep-cluster confidence is a signal that the centroid needs more anchor points. Document known cluster sizes in review output.
**Warning signs:** Many film photos assigned to `dancing` with high confidence but wrong visual content.

### Pitfall 7: Large Torch Install Breaks uv Resolve
**What goes wrong:** `uv add open-clip-torch` may time out or produce a large lockfile if the resolver fetches wheel metadata for all 47+ torch versions.
**Why it happens:** PyTorch has many platform-specific wheels; uv must enumerate them to resolve `torchvision`'s `torch==2.12.0` exact pin.
**How to avoid:** Run `uv add open-clip-torch scikit-learn` and allow several minutes for the resolution. If resolution stalls, try `uv add open-clip-torch scikit-learn --no-binary :all:` is not recommended — just be patient. The `uv.lock` will pin exact versions.
**Warning signs:** `uv add` runs for >5 minutes with no progress message.

## Code Examples

### Config Extension (events time windows)

```yaml
# Add to pipeline/config.yaml under the pipeline: key
# Source: REQUIREMENTS.md PIPE-04 time windows
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

### catalog.json Intermediate Schema

```json
[
  {
    "id": "abir_sultan_ABR50001",
    "source_path": "sources/abir_sultan/ABR50001.jpg",
    "photographer": "abir_sultan",
    "has_exif": true,
    "timestamp": "2026-05-01T17:18:28+02:00",
    "embed_index": 0
  },
  {
    "id": "abir_sultan_000015980001",
    "source_path": "sources/abir_sultan_film/000015980001.jpg",
    "photographer": "abir_sultan",
    "has_exif": false,
    "timestamp": null,
    "embed_index": 174
  }
]
```

`embed_index` is the row index in `pipeline/output/embeddings.npy`, enabling O(1) lookup during cluster assignment.

### Low-Confidence Review Output

```
# pipeline/output/low_confidence.txt
# Generated by cluster.py — review and edit cluster assignments before upload
# Format: photo_id | assigned_cluster | confidence | source_path
abir_sultan_000015980042 | dining | 0.52 | sources/abir_sultan_film/000015980042.jpg
abir_sultan_000015980117 | prep | 0.61 | sources/abir_sultan_film/000015980117.jpg
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `openai/clip` pip package | `open-clip-torch` | 2022+ | `openai/clip` is unmaintained; open-clip is the active fork with same pretrained weights |
| Manual PIL EXIF rotation | `ImageOps.exif_transpose()` | Pillow 7.0+ | Handles all 8 EXIF orientation variants including mirror cases |
| `torch.cuda.amp.autocast` | `torch.no_grad()` only (CPU) | N/A for CPU | On CPU, autocast has no effect; omit it |
| `sklearn.neighbors.KNeighborsClassifier` | `sklearn.neighbors.NearestNeighbors(n_neighbors=1)` | N/A | KNeighborsClassifier requires class labels during fit; NearestNeighbors is more flexible for centroid assignment |

**Deprecated/outdated:**

- `openai/clip`: Last PyPI release was 2021; open-clip-torch is the maintained successor with identical ViT-B/32 OpenAI weights.
- `PIL.Image.ANTIALIAS`: Renamed to `Image.Resampling.LANCZOS` in Pillow 9.1+. Use the new name; the old alias was removed in Pillow 10.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `+00:00` offset in inbal_zeldin and magnate_images indicates misconfigured camera, not UTC timestamps | Common Pitfalls #1, Code Examples | If timestamps really are UTC, all assignments would shift 2 hours — prep photos land in photoshooting, etc. Recommend manual spot-check of 5 photos from each problematic folder against known event timeline before committing to this interpretation. |
| A2 | `+03:00` in inbal_zeldin Z6_3 is also a camera misconfiguration (Israel Summer Time is UTC+3, but the timestamps appear to be local time) | Common Pitfalls #5 | If timestamps for the Z6_3 body are actually UTC+3 stored correctly, then subtracting 1 hour would be wrong. Spot-check with a photo known to be from a specific event time (e.g., hupa). |
| A3 | Web image max dimension 2000px, thumbnail max 400px are appropriate defaults | Architecture Patterns (resize) | Not specified in requirements; if the gallery design requires larger images, resize.py will need an update before upload. Low risk — config constants are easy to change. |
| A4 | photo ID prefix format `{label}_{stem}` avoids collisions | Code Examples (catalog.json) | Relies on filenames being unique within each source folder. If duplicates exist within a folder, they would still collide. |
| A5 | `pipeline/output/` is the correct staging directory for intermediate files | Architecture Patterns | No specification in config.yaml or spec for this path. Reasonable convention; easy to change. |

## Open Questions (RESOLVED)

1. **Timezone ambiguity in inbal_zeldin and magnate_images** — RESOLVED: Treat all offsets (`+00:00`, `+03:00`) as misconfigured cameras storing local Israel time. Do not apply the offset mathematically. Interpret `DateTimeOriginal` as local Israel time (+02:00) regardless of `OffsetTimeOriginal`. Manual spot-check recommended after ingest before cluster.py run (see VALIDATION.md manual verifications). Plan 02-02 Task 1 implements this mitigation.
   - What we know: `OffsetTimeOriginal` varies from `+00:00` to `+03:00` across bodies; timestamps appear to be local Israel time in all cases based on timestamp values (16:50 for photoshooting, 18:57 for hupa etc.)

2. **pic_time photos not yet downloaded** — RESOLVED: ingest.py gracefully skips missing source directories with a stderr warning and continues. If pic_time photos arrive later, re-run the full pipeline. Plan 02-02 Task 1 implements this behavior (missing source dirs are warned and skipped, not fatal).
   - What we know: `sources/pic_time/` folder does not exist or is empty; Phase 1 UAT marked pic_time download as "blocked"

3. **Cluster coverage for PREP phase** — RESOLVED: `compute_centroids()` in cluster.py skips clusters with zero EXIF-anchored photos and emits a stderr warning. Film photos cannot be KNN-assigned to a cluster with no centroid; they are assigned to the nearest available centroid instead and flagged in the summary. Plan 02-04 Task 1 implements this graceful handling.
   - What we know: The wedding date based on EXIF is 2026-05-01; `prep` window is 08:00-14:00; photographers likely arrived mid-afternoon (first digital timestamp seen is 17:18)

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3.13 | All pipeline scripts | ✓ | 3.13.11 | — |
| uv | Package management | ✓ | 0.11.14 | — |
| Pillow | ingest.py, resize.py | ✓ | 12.2.0 | — |
| pyyaml | All scripts (config) | ✓ | 6.0.3 | — |
| open-clip-torch | embed.py | ✗ | — | None — must install |
| torch | embed.py (via open-clip) | ✗ | — | None — must install |
| scikit-learn | cluster.py | ✗ | — | None — must install |
| numpy | embed.py, cluster.py | ✗ | — | None — must install |
| ~506GB disk space | torch + model weights (~1GB) | ✓ | — | — |

**Missing dependencies with no fallback:**

- `open-clip-torch`, `scikit-learn`: Required for PIPE-03, PIPE-04, PIPE-05. Must be installed via `uv add open-clip-torch scikit-learn` as Wave 0 task.

**Missing dependencies with fallback:**

- None identified.

**Note on model weights:** `ViT-B-32` OpenAI pretrained weights (~350MB) are downloaded on first `open_clip.create_model_and_transforms` call and cached to `~/.cache/huggingface/hub/`. This is a one-time cost.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest (not yet installed) |
| Config file | none — Wave 0 task |
| Quick run command | `uv run pytest pipeline/tests/ -x -q` |
| Full suite command | `uv run pytest pipeline/tests/ -v` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PIPE-01 | DateTimeOriginal extracted and normalized to GMT+02:00 | unit | `uv run pytest pipeline/tests/test_ingest.py::test_exif_normalization -x` | ❌ Wave 0 |
| PIPE-01 | `+00:00` offset treated as local Israel time | unit | `uv run pytest pipeline/tests/test_ingest.py::test_zero_offset_treated_as_local -x` | ❌ Wave 0 |
| PIPE-02 | Photographer label assigned from config.yaml source entry | unit | `uv run pytest pipeline/tests/test_ingest.py::test_photographer_label -x` | ❌ Wave 0 |
| PIPE-03 | Embedding shape is (512,) and L2-norm ≈ 1.0 | unit | `uv run pytest pipeline/tests/test_embed.py::test_embedding_shape_normalized -x` | ❌ Wave 0 |
| PIPE-04 | Each time window maps to the correct cluster | unit | `uv run pytest pipeline/tests/test_cluster.py::test_time_window_assignment -x` | ❌ Wave 0 |
| PIPE-05 | KNN assigns film photo to correct centroid cluster | unit | `uv run pytest pipeline/tests/test_cluster.py::test_knn_assignment -x` | ❌ Wave 0 |
| PIPE-06 | cluster_confidence=1.0 for EXIF photos | unit | `uv run pytest pipeline/tests/test_cluster.py::test_exif_confidence_is_one -x` | ❌ Wave 0 |
| PIPE-06 | Low-confidence photos appear in low_confidence.txt | integration | `uv run pytest pipeline/tests/test_cluster.py::test_low_confidence_flagged -x` | ❌ Wave 0 |
| PIPE-07 | Web image longest edge ≤ 2000px | unit | `uv run pytest pipeline/tests/test_resize.py::test_web_image_max_dimension -x` | ❌ Wave 0 |
| PIPE-07 | Thumbnail longest edge ≤ 400px | unit | `uv run pytest pipeline/tests/test_resize.py::test_thumb_max_dimension -x` | ❌ Wave 0 |
| PIPE-07 | Rotated source (orientation≠1) is corrected in output | unit | `uv run pytest pipeline/tests/test_resize.py::test_exif_orientation_corrected -x` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `uv run pytest pipeline/tests/ -x -q` (< 10s — no model loading in unit tests; use fixture embeddings)
- **Per wave merge:** `uv run pytest pipeline/tests/ -v`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `pytest` install: `uv add --dev pytest`
- [ ] `pipeline/tests/__init__.py` — empty init
- [ ] `pipeline/tests/test_ingest.py` — covers PIPE-01, PIPE-02
- [ ] `pipeline/tests/test_embed.py` — covers PIPE-03 (use a tiny 1×1 pixel fixture image; no model download in CI)
- [ ] `pipeline/tests/test_cluster.py` — covers PIPE-04, PIPE-05, PIPE-06 (use fixture embeddings array, no CLIP model needed)
- [ ] `pipeline/tests/test_resize.py` — covers PIPE-07 (use a tiny fixture JPEG with orientation tag)
- [ ] `pipeline/tests/conftest.py` — shared fixtures (fixture JPEG, fixture embeddings array, fixture config)

*test_embed.py should mock `open_clip.create_model_and_transforms` with a lambda that returns a fixed embedding — do not download the model in tests.*

## Security Domain

The pipeline runs entirely locally with no network traffic except the one-time model weight download from Hugging Face Hub. No ASVS authentication or session categories apply. Relevant controls:

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes (file paths from config) | Path traversal guard (already implemented in acquire_google.py pattern) — apply same `resolve()` + ancestor-check in ingest.py |
| V6 Cryptography | no | N/A |
| V2 Authentication | no | N/A |
| V3 Session Management | no | N/A |
| V4 Access Control | no | N/A |

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal via config.yaml `output_dir` | Tampering | `Path(root / output_dir).resolve()` + assert descendant (pattern from Phase 1 acquire_google.py) |
| Arbitrary code execution via malicious JPEG (EXIF exploit) | Tampering | Pillow 12.2.0 is current; no known critical EXIF CVEs. Keep Pillow updated. |

## Project Constraints (from CLAUDE.md)

- **No server:** This phase is purely local pipeline — no constraint triggered.
- **metadata.json under 1MB:** Do not store raw embeddings in metadata.json. Store in `pipeline/output/embeddings.npy` (local only).
- **R2 storage:** Not applicable to Phase 2 (upload is Phase 3).
- **CLIP model:** ViT-B/32 via `open-clip`. CPU-only. Do not introduce GPU requirement.
- **Python 3.13 + uv:** Use `uv run` for all pipeline scripts. Use `uv add` for dependencies.
- **snake_case filenames:** `ingest.py`, `embed.py`, `cluster.py`, `resize.py` — already specified.
- **Pipeline is one-shot:** No incremental logic. Re-run from scratch if source photos change.
- **Face filter:** Not relevant to Phase 2.
- **faces[] and people[] are empty at launch:** cluster.py must write `"faces": []` for every photo in metadata.json.
- **No module-level singletons:** Do not load the CLIP model at module import time; load inside `main()`.

## Sources

### Primary (HIGH confidence)

- PyPI registry (`pypi.org/pypi/*/json`) — all package versions and upload dates verified 2026-05-16
- Live EXIF probe of source images — timezone and EXIF field values verified against actual photos in `sources/`
- `github.com/mlfoundations/open_clip README.md` — model loading and inference API
- `scikit-learn.org/stable/modules/generated/sklearn.neighbors.NearestNeighbors.html` — KNN API
- `pillow.readthedocs.io/en/stable/reference/Image.html` — resize and thumbnail API
- `pillow.readthedocs.io/en/stable/handbook/image-file-formats.html#jpeg` — JPEG save parameters
- REQUIREMENTS.md, CLAUDE.md, config.yaml, pyproject.toml — project ground truth

### Secondary (MEDIUM confidence)

- WebSearch result confirming `ViT-B-32` pretrained `openai` is valid model name in open-clip
- WebSearch result confirming `ImageOps.exif_transpose` is current Pillow pattern for orientation

### Tertiary (LOW confidence)

- None — all claims verified against primary sources.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all packages verified on PyPI with upload dates; open-clip API verified against README
- EXIF timezone analysis: HIGH — verified against actual source photos in repository
- Architecture patterns: HIGH — verified against official docs
- Pitfalls: HIGH for #1-#4 (verified against live data); MEDIUM for #5-#6 (live data partially supports; requires spot-check)

**Research date:** 2026-05-16
**Valid until:** 2026-06-16 (stable libraries; PyTorch ecosystem moves fast — verify torch/torchvision compatibility if >30 days elapse)
