# Technology Stack

**Analysis Date:** 2026-05-16

## Languages

**Primary:**
- Python 3.13 - Offline pipeline (ingest, embed, cluster, resize, upload)
- JavaScript (JSX) - React frontend site

**Secondary:**
- YAML - Pipeline configuration (`pipeline/config.yaml`)
- JSON - Metadata schema (`metadata.json`)

## Runtime

**Environment:**
- Python 3.13 (pinned via `.python-version`)
- Node.js (version not yet pinned — no `.nvmrc`)

**Package Manager:**
- Python: `uv` — project defined in `pyproject.toml`
- Node.js: `npm` — lockfile not yet present (site scaffolding pending)
- Lockfile: Python lockfile not present (`pyproject.toml` has empty `dependencies = []`)

## Frameworks

**Core (planned):**
- React — frontend UI (`site/src/`)
- Vite — dev server and production build tooling for the React site

**Build/Dev:**
- Vite — `npm run dev` / `npm run build` → `dist/`
- Wrangler (Cloudflare CLI) — deploy `dist/` to Cloudflare Pages via `wrangler pages deploy dist/`

## Key Dependencies

**Python pipeline (planned — not yet in pyproject.toml):**
- `open-clip` or `clip` (OpenAI ViT-B/32) — CLIP embeddings for film photos with no EXIF
- `Pillow` — EXIF extraction and image resizing/compression
- `scikit-learn` — KNN cluster assignment for film photos
- `boto3` / AWS S3-compatible client — upload images and `metadata.json` to Cloudflare R2

**Frontend (planned — no package.json yet):**
- React — component rendering
- Vite — bundler/dev server

**Infrastructure:**
- `wrangler` (npm) — Cloudflare Pages deployment CLI

## Configuration

**Environment:**
- Pipeline R2 credentials stored externally (not committed); passed as env vars or via `pipeline/config.yaml`
- Required runtime config: R2 endpoint URL, R2 bucket name, R2 access credentials
- Event time windows for EXIF-based clustering defined in `pipeline/config.yaml`

**Build:**
- `pyproject.toml` — Python project manifest (currently empty dependencies, requires-python = ">=3.13")
- `.python-version` — pins Python to 3.13
- Vite config not yet scaffolded (`site/` directory not yet created)

## Platform Requirements

**Development:**
- Python 3.13+
- `uv` package manager
- Node.js + npm (for site)
- CPU-only machine sufficient for CLIP embeddings (~minutes for 1200 photos)

**Production:**
- Cloudflare R2 — image and metadata storage (zero egress fees)
- Cloudflare Pages — static site hosting (free tier)
- No server or backend runtime required

---

*Stack analysis: 2026-05-16*
