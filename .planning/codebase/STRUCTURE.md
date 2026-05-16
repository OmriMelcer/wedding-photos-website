# Codebase Structure

**Analysis Date:** 2026-05-16

## Current State

The repository is pre-implementation. Only the project scaffold and specification documents exist. The planned directory layout below is the authoritative target structure from `CLAUDE.md` and `wedding_album_spec.md`.

## Directory Layout

```
wedding-photos-website/
├── pipeline/                  # Offline Python ETL pipeline (to be created)
│   ├── ingest.py              # Walk source folders, extract EXIF, tag photographer
│   ├── embed.py               # CLIP ViT-B/32 embeddings for all photos
│   ├── cluster.py             # EXIF time-window + KNN cluster assignment
│   ├── resize.py              # Web-quality compression + thumbnail generation
│   ├── upload.py              # Push images + metadata.json to Cloudflare R2
│   └── config.yaml            # Event time windows, photographer names, R2 config
├── site/                      # React static frontend (to be created)
│   ├── src/
│   │   ├── App.jsx            # Root component; fetches metadata.json; owns filter state
│   │   ├── Gallery.jsx        # Masonry grid of filtered photos
│   │   ├── Filters.jsx        # Photographer/cluster/face filter bar
│   │   └── Lightbox.jsx       # Full-screen photo viewer
│   ├── public/                # Static assets (favicon, etc.)
│   ├── package.json           # Vite-based React app dependencies
│   └── dist/                  # Build output (gitignored) → deployed to Cloudflare Pages
├── .planning/
│   ├── HANDOFF.json           # GSD orchestrator state
│   └── codebase/              # Codebase map documents
├── .claude/
│   └── settings.json          # Claude Code project settings
├── .python-version            # Python 3.13 (used by uv)
├── pyproject.toml             # Python project config (root-level scaffold)
├── main.py                    # Root-level Python stub (placeholder)
├── CLAUDE.md                  # Project guidance for Claude Code
├── wedding_album_spec.md      # Full project specification
└── README.md                  # Project readme
```

## Directory Purposes

**`pipeline/`:**
- Purpose: Offline ETL pipeline that transforms raw source photos into the static data artifacts consumed by the site
- Contains: Python scripts (one per pipeline stage), YAML config
- Key files: `pipeline/config.yaml` (time windows and R2 settings that must be filled in before first run)
- Run order: `ingest.py` → `embed.py` → `cluster.py` → `resize.py` → `upload.py`

**`site/`:**
- Purpose: Vite-based React app built to static files and deployed to Cloudflare Pages
- Contains: JSX components, Vite config, npm dependencies
- Key files: `site/src/App.jsx` (root), `site/package.json`

**`site/src/`:**
- Purpose: All React component source code
- Contains: Four JSX components covering the complete UI
- Key files: `App.jsx`, `Gallery.jsx`, `Filters.jsx`, `Lightbox.jsx`

**`site/dist/`:**
- Purpose: Vite build output — static HTML/JS/CSS
- Generated: Yes (by `npm run build`)
- Committed: No (gitignored)
- Deployed via: `wrangler pages deploy dist/`

**`.planning/`:**
- Purpose: GSD orchestration state and codebase analysis documents
- Generated: Partially (by GSD tooling)
- Committed: Yes

## Key File Locations

**Entry Points:**
- `site/src/App.jsx`: React app root; first component to render
- `pipeline/ingest.py`: First stage of the pipeline; start here to trace pipeline flow

**Configuration:**
- `pipeline/config.yaml`: Event phase time windows, photographer label names, Cloudflare R2 endpoint — must be populated before running the pipeline
- `site/package.json`: npm dependencies and scripts for the React site
- `pyproject.toml`: Python project metadata; dependencies managed via `uv`
- `.python-version`: Pins Python to 3.13

**Core Logic:**
- `pipeline/cluster.py`: Most complex pipeline stage — EXIF time-window labeling and KNN assignment using CLIP embeddings
- `pipeline/embed.py`: CLIP embedding computation; defines the ML model used (ViT-B/32)
- `site/src/App.jsx`: Owns the runtime data fetch and all filter state

**Specification:**
- `wedding_album_spec.md`: Authoritative project spec; consult before making architectural decisions
- `CLAUDE.md`: Operational guidance for running, building, and deploying

## Naming Conventions

**Files:**
- Pipeline scripts: `lowercase_snake_case.py` (e.g., `ingest.py`, `cluster.py`)
- React components: `PascalCase.jsx` (e.g., `App.jsx`, `Gallery.jsx`)
- Config files: `lowercase.yaml` / `lowercase.json`

**Directories:**
- Top-level: `lowercase/` (e.g., `pipeline/`, `site/`)
- React source: `src/` (standard Vite convention)

**Photo identifiers:**
- `id` field in metadata.json: `img_NNNN` format (e.g., `img_0042`)
- Filenames: preserve original source filename (e.g., `img_0042.jpg`)

**Event clusters (fixed vocabulary):**
- `prep`, `photoshooting`, `hupa`, `dining`, `party`

## Where to Add New Code

**New pipeline stage:**
- Implementation: `pipeline/<stage_name>.py`
- Config entries: `pipeline/config.yaml`
- Run via: `uv run python pipeline/<stage_name>.py`

**New React UI component:**
- Implementation: `site/src/<ComponentName>.jsx`
- Import into: `site/src/App.jsx` or the relevant parent component

**New metadata.json field:**
- Add in: `pipeline/upload.py` (where metadata is assembled and written)
- Populate in: the appropriate pipeline stage (ingest, cluster, etc.)
- Consume in: the relevant React component under `site/src/`

**Utilities shared across pipeline scripts:**
- Implementation: `pipeline/utils.py` (does not exist yet; create if shared helpers are needed)

**Static site assets (icons, fonts):**
- Location: `site/public/`

## Special Directories

**`site/dist/`:**
- Purpose: Vite production build output
- Generated: Yes (by `npm run build`)
- Committed: No

**`.planning/`:**
- Purpose: GSD tooling state files and codebase analysis
- Generated: Partially
- Committed: Yes

**`.claude/`:**
- Purpose: Claude Code project settings
- Generated: By Claude Code tooling
- Committed: Yes (`settings.json` only)

---

*Structure analysis: 2026-05-16*
