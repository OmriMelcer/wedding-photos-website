# Coding Conventions

**Analysis Date:** 2026-05-16

> **Note:** This codebase is at pre-implementation stage. Only `main.py` (a stub) and `pyproject.toml` exist. Conventions below are derived from the project spec (`wedding_album_spec.md`), `CLAUDE.md`, and the intended repository structure. When code is written, these should be enforced and this document updated.

## Naming Patterns

**Python files (`pipeline/`):**
- `snake_case` for all filenames: `ingest.py`, `embed.py`, `cluster.py`, `resize.py`, `upload.py`
- Each file named after its single pipeline responsibility

**JavaScript/React files (`site/src/`):**
- `PascalCase` for component files: `App.jsx`, `Gallery.jsx`, `Filters.jsx`, `Lightbox.jsx`
- `.jsx` extension for React components

**Configuration files:**
- `snake_case` YAML: `config.yaml`
- `camelCase` JSON keys in `metadata.json` (e.g., `r2_url`, `thumb_url`, `cluster_confidence`)

**Python variables and functions:**
- `snake_case` per PEP 8 convention (Python 3.13 project)
- Current stub: `main()` function in `main.py`

**React/JS variables and functions:**
- `camelCase` for variables and functions (standard JS convention)
- `PascalCase` for React component names

**Event cluster values:**
- String literals (not enums at launch): `"prep"`, `"photoshooting"`, `"hupa"`, `"dining"`, `"party"`

**Photographer identifiers:**
- String labels in metadata (e.g., `"photographer_a"`) — exact labels determined by `config.yaml`

## Code Style

**Formatting (Python):**
- No formatter explicitly configured yet
- Recommend: `ruff format` (fast, PEP 8 compliant) via `uv` toolchain
- Target: Python 3.13, `requires-python = ">=3.13"` in `pyproject.toml`

**Formatting (JavaScript/React):**
- No formatter configured yet
- Recommend: Prettier via Vite scaffold defaults

**Linting:**
- No linting configured yet (`pyproject.toml` has no `[tool.ruff]` or `[tool.mypy]` sections)
- No ESLint or Biome configured for the site

## Import Organization

**Python:**
- Standard library first, then third-party (PEP 8 convention applies)
- Expected third-party imports per spec: `open_clip` or `clip`, `PIL` (Pillow), `sklearn`, `boto3`/`cloudflare` SDK

**JavaScript/React:**
- React imports first, then component imports
- No path aliases defined yet (Vite scaffold default)

## Error Handling

**Python pipeline:**
- No error handling patterns established yet
- Pipeline is described as "one-shot" — designed to run once locally, not resilient to partial failures
- No retry logic implied; re-run the full pipeline if something fails

**React frontend:**
- No error boundary pattern established yet
- Primary failure mode: `metadata.json` fetch failure — should be handled gracefully

## Logging

**Framework:** Not configured (no `logging` module usage in current code)

**Patterns:**
- Current stub uses `print()`: `print("Hello from wedding-photos-website!")`
- For pipeline scripts: `print()` or Python `logging` module are both acceptable given the one-shot, local nature

## Comments

**When to Comment:**
- No comment conventions established yet
- Spec documents intent via inline spec comments (e.g., `# hides face filter when people[] is empty` in `Filters.jsx` description)
- Follow same approach: document non-obvious behavior inline

**Docstrings:**
- No docstring usage in current code (stub only)
- PEP 257 style recommended for pipeline module functions

## Function Design

**Size:**
- Each pipeline script (`ingest.py`, `embed.py`, etc.) represents one pipeline stage — keep each focused on that single responsibility
- Current stub follows single-function pattern: `main()` entry point

**Parameters:**
- No patterns established yet

**Return Values:**
- Pipeline scripts are expected to write output (files, `metadata.json`) rather than return values between scripts

## Module Design

**Exports:**
- Python pipeline modules: entry point via `if __name__ == "__main__": main()` pattern (established in `main.py` stub)
- React components: default export per component file

**Barrel Files:**
- Not applicable at this stage; no `index.js` barrel pattern implied in spec

## Data Conventions

**`metadata.json` schema keys:**
- `snake_case` (e.g., `r2_url`, `thumb_url`, `cluster_confidence`)
- Timestamps: ISO 8601 format (`"2025-06-14T17:32:00"`)
- Cluster values: lowercase string literals
- Empty arrays `[]` for `faces` and `people` at launch (Phase 2 populates them)

**Size constraint:**
- Keep `metadata.json` under 1MB total (per CLAUDE.md)

## Run Commands

```bash
# Python pipeline (via uv)
uv run python pipeline/ingest.py
uv run python pipeline/embed.py
uv run python pipeline/cluster.py
uv run python pipeline/resize.py
uv run python pipeline/upload.py

# React site
cd site && npm install
cd site && npm run dev
cd site && npm run build
```

---

*Convention analysis: 2026-05-16*
