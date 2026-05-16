# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A static wedding photo album website built from an offline Python pipeline and served as a fully static React app — no backend, no database, no server. See `wedding_album_spec.md` for the full spec.

## Planned Repository Structure

```
wedding-album/
├── pipeline/
│   ├── ingest.py          # walks source folders, extracts EXIF, tags photographer
│   ├── embed.py           # CLIP embeddings for all photos
│   ├── cluster.py         # EXIF-anchor + KNN assignment to event clusters
│   ├── resize.py          # web-quality compression
│   ├── upload.py          # pushes images + metadata.json to R2
│   └── config.yaml        # time windows, photographer names, R2 config
├── site/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── Gallery.jsx
│   │   ├── Filters.jsx    # hides face filter when people[] is empty
│   │   └── Lightbox.jsx
│   └── package.json       # Vite-based React app
└── pipeline/pyproject.toml
```

## Pipeline Commands (Python 3.13)

```bash
# Run individual pipeline stages
uv run python pipeline/ingest.py
uv run python pipeline/embed.py
uv run python pipeline/cluster.py
uv run python pipeline/resize.py
uv run python pipeline/upload.py
```

## Site Commands

```bash
cd site
npm install
npm run dev       # local dev server
npm run build     # production build → dist/
```

## Deployment

```bash
# Initial deploy
npm run build
wrangler pages deploy dist/

# Update metadata only (no redeploy needed)
aws s3 cp metadata.json s3://r2-bucket/ --endpoint-url <R2_ENDPOINT>
```

## Architecture

The pipeline runs **once, locally** and outputs `metadata.json` + compressed images to Cloudflare R2. The React app fetches `metadata.json` at runtime and filters entirely in-memory — no API calls after that initial fetch.

### Event Clusters

Photos are assigned to one of five phases: `prep`, `photoshooting`, `hupa`, `dining`, `dancing`.

- **Digital photos (with EXIF):** assigned by timestamp against known event time windows defined in `config.yaml`.
- **Film scans (no EXIF):** CLIP embeddings (ViT-B/32) computed locally; assigned to nearest cluster centroid via KNN using `scikit-learn`.

### metadata.json Schema

```json
{
  "photos": [{
    "id": "img_0042",
    "filename": "img_0042.jpg",
    "r2_url": "https://r2.example.com/photos/img_0042.jpg",
    "thumb_url": "https://r2.example.com/thumbs/img_0042.jpg",
    "photographer": "photographer_a",
    "timestamp": "2025-06-14T17:32:00",
    "cluster": "hupa",
    "cluster_confidence": 0.91,
    "faces": []
  }],
  "people": []
}
```

`faces[]` and `people[]` are intentionally empty at launch. The face filter in the UI **must remain hidden** when `people.length === 0`. Phase 2 face recognition populates these fields by re-uploading `metadata.json` — no frontend code changes required.

## Key Design Decisions

- **R2 over S3/GCS**: Zero egress fees. Do not switch storage backends without verifying egress cost at ~100 guests × ~1200 photos.
- **No server**: All filtering is in-memory in the browser. Keep `metadata.json` under 1MB.
- **CLIP model**: Use `open-clip` or OpenAI `clip` (ViT-B/32). CPU-only is fine — ~minutes for 1200 photos.
- **Pipeline is one-shot**: Not designed to be incremental. Re-run the full pipeline if source photos change.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Wedding Photo Album**

A static wedding photo album website for ~1000–1200 photos from 3 photographers, built once from an offline Python pipeline and served as a fully static React app. Guests browse and filter photos by photographer and wedding phase. The site is in Hebrew with RTL layout.

**Core Value:** Every guest can find and view every photo from the wedding, filtered by who shot it and when it happened — with zero hosting costs and no maintenance burden.

### Constraints

- **No server:** Zero runtime server code. Pipeline runs locally, outputs go to R2, site is static.
- **metadata.json under 1MB:** At 1200 photos this is fine. Do not store raw embeddings in the file.
- **R2 storage:** Do not switch to S3/GCS — egress fees at ~100 guests × ~1200 photos would be non-trivial.
- **CLIP model:** ViT-B/32 via `open-clip`. CPU-only acceptable (~minutes for 1200 photos).
- **1-day build budget:** Pipeline morning, site afternoon.
- **Python 3.13 + uv:** Pinned via `.python-version`. Use `uv run` for all pipeline scripts.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- Python 3.13 - Offline pipeline (ingest, embed, cluster, resize, upload)
- JavaScript (JSX) - React frontend site
- YAML - Pipeline configuration (`pipeline/config.yaml`)
- JSON - Metadata schema (`metadata.json`)
## Runtime
- Python 3.13 (pinned via `.python-version`)
- Node.js (version not yet pinned — no `.nvmrc`)
- Python: `uv` — project defined in `pyproject.toml`
- Node.js: `npm` — lockfile not yet present (site scaffolding pending)
- Lockfile: Python lockfile not present (`pyproject.toml` has empty `dependencies = []`)
## Frameworks
- React — frontend UI (`site/src/`)
- Vite — dev server and production build tooling for the React site
- Vite — `npm run dev` / `npm run build` → `dist/`
- Wrangler (Cloudflare CLI) — deploy `dist/` to Cloudflare Pages via `wrangler pages deploy dist/`
## Key Dependencies
- `open-clip` or `clip` (OpenAI ViT-B/32) — CLIP embeddings for film photos with no EXIF
- `Pillow` — EXIF extraction and image resizing/compression
- `scikit-learn` — KNN cluster assignment for film photos
- `boto3` / AWS S3-compatible client — upload images and `metadata.json` to Cloudflare R2
- React — component rendering
- Vite — bundler/dev server
- `wrangler` (npm) — Cloudflare Pages deployment CLI
## Configuration
- Pipeline R2 credentials stored externally (not committed); passed as env vars or via `pipeline/config.yaml`
- Required runtime config: R2 endpoint URL, R2 bucket name, R2 access credentials
- Event time windows for EXIF-based clustering defined in `pipeline/config.yaml`
- `pyproject.toml` — Python project manifest (currently empty dependencies, requires-python = ">=3.13")
- `.python-version` — pins Python to 3.13
- Vite config not yet scaffolded (`site/` directory not yet created)
## Platform Requirements
- Python 3.13+
- `uv` package manager
- Node.js + npm (for site)
- CPU-only machine sufficient for CLIP embeddings (~minutes for 1200 photos)
- Cloudflare R2 — image and metadata storage (zero egress fees)
- Cloudflare Pages — static site hosting (free tier)
- No server or backend runtime required
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- `snake_case` for all filenames: `ingest.py`, `embed.py`, `cluster.py`, `resize.py`, `upload.py`
- Each file named after its single pipeline responsibility
- `PascalCase` for component files: `App.jsx`, `Gallery.jsx`, `Filters.jsx`, `Lightbox.jsx`
- `.jsx` extension for React components
- `snake_case` YAML: `config.yaml`
- `camelCase` JSON keys in `metadata.json` (e.g., `r2_url`, `thumb_url`, `cluster_confidence`)
- `snake_case` per PEP 8 convention (Python 3.13 project)
- Current stub: `main()` function in `main.py`
- `camelCase` for variables and functions (standard JS convention)
- `PascalCase` for React component names
- String literals (not enums at launch): `"prep"`, `"photoshooting"`, `"hupa"`, `"dining"`, `"dancing"`
- String labels in metadata (e.g., `"photographer_a"`) — exact labels determined by `config.yaml`
## Code Style
- No formatter explicitly configured yet
- Recommend: `ruff format` (fast, PEP 8 compliant) via `uv` toolchain
- Target: Python 3.13, `requires-python = ">=3.13"` in `pyproject.toml`
- No formatter configured yet
- Recommend: Prettier via Vite scaffold defaults
- No linting configured yet (`pyproject.toml` has no `[tool.ruff]` or `[tool.mypy]` sections)
- No ESLint or Biome configured for the site
## Import Organization
- Standard library first, then third-party (PEP 8 convention applies)
- Expected third-party imports per spec: `open_clip` or `clip`, `PIL` (Pillow), `sklearn`, `boto3`/`cloudflare` SDK
- React imports first, then component imports
- No path aliases defined yet (Vite scaffold default)
## Error Handling
- No error handling patterns established yet
- Pipeline is described as "one-shot" — designed to run once locally, not resilient to partial failures
- No retry logic implied; re-run the full pipeline if something fails
- No error boundary pattern established yet
- Primary failure mode: `metadata.json` fetch failure — should be handled gracefully
## Logging
- Current stub uses `print()`: `print("Hello from wedding-photos-website!")`
- For pipeline scripts: `print()` or Python `logging` module are both acceptable given the one-shot, local nature
## Comments
- No comment conventions established yet
- Spec documents intent via inline spec comments (e.g., `# hides face filter when people[] is empty` in `Filters.jsx` description)
- Follow same approach: document non-obvious behavior inline
- No docstring usage in current code (stub only)
- PEP 257 style recommended for pipeline module functions
## Function Design
- Each pipeline script (`ingest.py`, `embed.py`, etc.) represents one pipeline stage — keep each focused on that single responsibility
- Current stub follows single-function pattern: `main()` entry point
- No patterns established yet
- Pipeline scripts are expected to write output (files, `metadata.json`) rather than return values between scripts
## Module Design
- Python pipeline modules: entry point via `if __name__ == "__main__": main()` pattern (established in `main.py` stub)
- React components: default export per component file
- Not applicable at this stage; no `index.js` barrel pattern implied in spec
## Data Conventions
- `snake_case` (e.g., `r2_url`, `thumb_url`, `cluster_confidence`)
- Timestamps: ISO 8601 format (`"2025-06-14T17:32:00"`)
- Cluster values: lowercase string literals
- Empty arrays `[]` for `faces` and `people` at launch (Phase 2 populates them)
- Keep `metadata.json` under 1MB total (per CLAUDE.md)
## Run Commands
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
```text
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
- The pipeline is a one-shot, linear ETL executed locally. It is not incremental.
- The React site is purely static. There is no backend, API server, or database at runtime.
- All filtering and state management happens in-memory in the browser after a single `metadata.json` fetch.
- `metadata.json` is the contract between the pipeline and the site. Schema changes in the pipeline are the only way to affect the site's data capabilities.
## Layers
- Purpose: Transform raw source photos into a structured metadata artifact and compressed images
- Location: `pipeline/`
- Contains: Python scripts executed sequentially; YAML config
- Depends on: Local filesystem (source photo folders), `open-clip`, `Pillow`, `scikit-learn`
- Used by: Nothing at runtime — outputs are uploaded to R2 and consumed only by the site
- Purpose: Serve images and metadata.json at zero egress cost
- Location: Cloudflare R2 (external)
- Contains: `metadata.json`, `/photos/*.jpg`, `/thumbs/*.jpg`
- Depends on: Pipeline upload step
- Used by: React site (fetches on load)
- Purpose: Present a filterable, browsable photo gallery to guests
- Location: `site/src/`
- Contains: React JSX components; built via Vite to static HTML/JS/CSS
- Depends on: `metadata.json` fetched from R2 at runtime
- Used by: End users (guests) via browser
## Data Flow
### Pipeline Execution Path
### Runtime Site Request Path
- All state lives in `App.jsx` (React component state). No external state library. Filter state and the full photo array are passed down as props. There is no server-side state.
## Key Abstractions
- Purpose: Single source of truth bridging the offline pipeline and the runtime site
- Location: Generated by `pipeline/upload.py`; served from Cloudflare R2
- Schema: `{ photos: Photo[], people: Person[] }` where `Photo` includes id, filename, r2_url, thumb_url, photographer, timestamp, cluster, cluster_confidence, faces
- Purpose: Groups photos into wedding phases for filtering
- Values: `prep`, `photoshooting`, `hupa`, `dining`, `dancing`
- Assignment: EXIF timestamp comparison against `pipeline/config.yaml` time windows (digital); KNN against CLIP centroids (film)
- Purpose: Identifies which of the 4 photographers took a photo
- Assignment: Determined by source folder in `pipeline/ingest.py`
- Used by: Filter UI in `site/src/Filters.jsx`
## Entry Points
- Location: Each script in `pipeline/` is its own entry point, run in order via `uv run python pipeline/<script>.py`
- Triggers: Manual execution by maintainer (Omri)
- Responsibilities: Sequential ETL — ingest → embed → cluster → resize → upload
- Location: `site/src/App.jsx`
- Triggers: Browser page load
- Responsibilities: Fetch metadata.json, initialize filter state, render top-level layout
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
### Fetching individual photos from the pipeline output directory
### Filtering on the server
## Error Handling
- Pipeline: Python exceptions are expected to halt execution; no partial-upload recovery needed.
- Site: If `metadata.json` fetch fails, `App.jsx` should render an error state rather than a broken gallery.
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
