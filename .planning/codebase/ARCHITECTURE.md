<!-- refreshed: 2026-05-16 -->
# Architecture

**Analysis Date:** 2026-05-16

## System Overview

```text
┌──────────────────────────────────────────────────────────────┐
│              Local Python Pipeline (one-shot, offline)        │
├──────────┬───────────┬───────────┬──────────┬────────────────┤
│ ingest   │  embed    │  cluster  │  resize  │    upload      │
│ .py      │  .py      │  .py      │  .py     │    .py         │
│(EXIF/tag)│ (CLIP     │ (EXIF-    │ (web     │ (R2 push)      │
│          │  embed)   │  KNN)     │  resize) │                │
└──────────┴───────────┴───────────┴──────────┴────────┬───────┘
                                                        │
                         pipeline/config.yaml ──────────┘
                                                        │
                                                        ▼
┌──────────────────────────────────────────────────────────────┐
│                     Cloudflare R2                             │
│  metadata.json   /photos/*.jpg   /thumbs/*.jpg                │
└───────────────────────────┬──────────────────────────────────┘
                            │  fetch on load (single request)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│              React Static Site (Cloudflare Pages)             │
├─────────────┬──────────────┬──────────────────────────────────┤
│  App.jsx    │  Filters.jsx │  Gallery.jsx   Lightbox.jsx      │
│ (root/data) │  (filter UI) │  (masonry grid) (photo viewer)  │
└─────────────┴──────────────┴──────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| ingest.py | Walk source folders, extract EXIF, tag photographer | `pipeline/ingest.py` |
| embed.py | Compute CLIP (ViT-B/32) embeddings for all photos | `pipeline/embed.py` |
| cluster.py | EXIF time-window labeling + KNN assignment for film photos | `pipeline/cluster.py` |
| resize.py | Compress to web quality; produce thumbnails | `pipeline/resize.py` |
| upload.py | Push images + metadata.json to Cloudflare R2 | `pipeline/upload.py` |
| config.yaml | Event time windows, photographer names, R2 endpoint | `pipeline/config.yaml` |
| App.jsx | Root component; fetches metadata.json; owns filter state | `site/src/App.jsx` |
| Filters.jsx | Photographer/cluster filter bar; hides face filter when people[] is empty | `site/src/Filters.jsx` |
| Gallery.jsx | Responsive masonry grid; renders filtered photo set | `site/src/Gallery.jsx` |
| Lightbox.jsx | Full-screen photo viewer on click | `site/src/Lightbox.jsx` |

## Pattern Overview

**Overall:** Offline-build → Static CDN delivery. Two completely separate subsystems (pipeline and site) with `metadata.json` as the sole handoff artifact.

**Key Characteristics:**
- The pipeline is a one-shot, linear ETL executed locally. It is not incremental.
- The React site is purely static. There is no backend, API server, or database at runtime.
- All filtering and state management happens in-memory in the browser after a single `metadata.json` fetch.
- `metadata.json` is the contract between the pipeline and the site. Schema changes in the pipeline are the only way to affect the site's data capabilities.

## Layers

**Pipeline Layer:**
- Purpose: Transform raw source photos into a structured metadata artifact and compressed images
- Location: `pipeline/`
- Contains: Python scripts executed sequentially; YAML config
- Depends on: Local filesystem (source photo folders), `open-clip`, `Pillow`, `scikit-learn`
- Used by: Nothing at runtime — outputs are uploaded to R2 and consumed only by the site

**Storage Layer:**
- Purpose: Serve images and metadata.json at zero egress cost
- Location: Cloudflare R2 (external)
- Contains: `metadata.json`, `/photos/*.jpg`, `/thumbs/*.jpg`
- Depends on: Pipeline upload step
- Used by: React site (fetches on load)

**Frontend Layer:**
- Purpose: Present a filterable, browsable photo gallery to guests
- Location: `site/src/`
- Contains: React JSX components; built via Vite to static HTML/JS/CSS
- Depends on: `metadata.json` fetched from R2 at runtime
- Used by: End users (guests) via browser

## Data Flow

### Pipeline Execution Path

1. Read source photo folders, extract EXIF metadata, tag by photographer (`pipeline/ingest.py`)
2. Compute CLIP embeddings for all photos — needed for film scans without EXIF (`pipeline/embed.py`)
3. Assign cluster labels: EXIF photos via time windows in `pipeline/config.yaml`; film photos via KNN against cluster centroids (`pipeline/cluster.py`)
4. Resize and compress photos to web quality; generate thumbnails (`pipeline/resize.py`)
5. Write `metadata.json` and push all images to Cloudflare R2 (`pipeline/upload.py`)

### Runtime Site Request Path

1. Browser loads static assets from Cloudflare Pages (`site/dist/`)
2. `App.jsx` fetches `metadata.json` from Cloudflare R2 (single HTTP request)
3. `App.jsx` holds full photo list and active filter state in React state
4. `Filters.jsx` renders photographer and cluster filters; renders face filter only when `people.length > 0`
5. `Gallery.jsx` receives filtered photo array from `App.jsx`; renders masonry grid with thumb_url images
6. `Lightbox.jsx` opens on photo click and serves the r2_url (full-res) image

**State Management:**
- All state lives in `App.jsx` (React component state). No external state library. Filter state and the full photo array are passed down as props. There is no server-side state.

## Key Abstractions

**metadata.json:**
- Purpose: Single source of truth bridging the offline pipeline and the runtime site
- Location: Generated by `pipeline/upload.py`; served from Cloudflare R2
- Schema: `{ photos: Photo[], people: Person[] }` where `Photo` includes id, filename, r2_url, thumb_url, photographer, timestamp, cluster, cluster_confidence, faces

**Event Cluster:**
- Purpose: Groups photos into wedding phases for filtering
- Values: `prep`, `photoshooting`, `hupa`, `dining`, `party`
- Assignment: EXIF timestamp comparison against `pipeline/config.yaml` time windows (digital); KNN against CLIP centroids (film)

**Photographer Tag:**
- Purpose: Identifies which of the 4 photographers took a photo
- Assignment: Determined by source folder in `pipeline/ingest.py`
- Used by: Filter UI in `site/src/Filters.jsx`

## Entry Points

**Pipeline:**
- Location: Each script in `pipeline/` is its own entry point, run in order via `uv run python pipeline/<script>.py`
- Triggers: Manual execution by maintainer (Omri)
- Responsibilities: Sequential ETL — ingest → embed → cluster → resize → upload

**Site:**
- Location: `site/src/App.jsx`
- Triggers: Browser page load
- Responsibilities: Fetch metadata.json, initialize filter state, render top-level layout

**Build:**
- Location: `site/package.json` (`npm run build`)
- Output: `site/dist/` — static files deployed to Cloudflare Pages via `wrangler pages deploy dist/`

## Architectural Constraints

- **No server:** Zero runtime server code. All logic runs either in the pipeline (Python, local) or in the browser (React, client-side). Do not introduce a backend.
- **One-shot pipeline:** The pipeline is not incremental. Re-run the full sequence if source photos change. Do not add partial-update logic.
- **metadata.json size:** Must stay under 1MB. At 1200 photos this is comfortably achievable; adding large face embedding vectors would violate this — store only photo ID lists per person, not raw embeddings.
- **R2 egress:** Do not switch image storage away from Cloudflare R2 without verifying egress cost. At ~100 guests × ~1200 photos, egress on S3/GCS would be non-trivial.
- **CLIP model:** Use ViT-B/32 via `open-clip` or OpenAI `clip`. CPU-only execution is acceptable (~minutes for 1200 photos). Do not introduce a GPU requirement.
- **Face filter visibility:** `Filters.jsx` must hide the face filter when `people.length === 0`. This is a hard UI rule enabling Phase 2 with no code changes.
- **Global state:** None. No module-level singletons. All runtime state is React component state in `App.jsx`.
- **Circular imports:** Not applicable — pipeline scripts run independently; site components have a clear parent-child hierarchy.

## Anti-Patterns

### Calling the pipeline at runtime

**What happens:** Triggering any pipeline script (embed.py, cluster.py, etc.) from the React site or from a deployed function.
**Why it's wrong:** The pipeline is a local, one-shot ETL that requires direct access to source photos and runs CPU-heavy ML models. It is not a web service.
**Do this instead:** Run the pipeline locally, upload outputs to R2, and let the site consume the static `metadata.json`.

### Fetching individual photos from the pipeline output directory

**What happens:** The site serving images from a local `pipeline/output/` directory rather than from R2 URLs.
**Why it's wrong:** Images must be served from R2 (zero egress). Local paths are only valid during development/testing.
**Do this instead:** Always use `r2_url` and `thumb_url` from `metadata.json` in Gallery and Lightbox components.

### Filtering on the server

**What happens:** Introducing an API endpoint that accepts filter parameters and returns a filtered photo list.
**Why it's wrong:** This adds a server dependency, violates the static-only architecture, and adds hosting cost and maintenance burden.
**Do this instead:** Load the full `metadata.json` once in `App.jsx` and filter the array in-memory in React.

## Error Handling

**Strategy:** Not yet implemented (codebase is pre-implementation). Per spec, error paths should be handled at the pipeline boundary — if a pipeline stage fails, the operator retries the full pipeline.

**Patterns:**
- Pipeline: Python exceptions are expected to halt execution; no partial-upload recovery needed.
- Site: If `metadata.json` fetch fails, `App.jsx` should render an error state rather than a broken gallery.

## Cross-Cutting Concerns

**Logging:** Pipeline only (Python print/logging to stdout). Site has no logging infrastructure.
**Validation:** `pipeline/cluster.py` assigns a `cluster_confidence` score; low-confidence assignments should be flagged for human review before upload.
**Authentication:** None. The site and all R2 assets are public (intended for ~100 wedding guests without login).

---

*Architecture analysis: 2026-05-16*
