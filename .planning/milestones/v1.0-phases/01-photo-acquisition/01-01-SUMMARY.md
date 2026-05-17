---
phase: 01-photo-acquisition
plan: "01"
subsystem: pipeline
tags: [config, acquisition, google-photos, gallery-dl, pyyaml]
dependency_graph:
  requires: []
  provides: [pipeline/config.yaml, pipeline/acquire_google.py]
  affects: [pipeline/ingest.py, pipeline/embed.py, pipeline/cluster.py]
tech_stack:
  added: [gallery-dl, pyyaml]
  patterns: [uv-add, subprocess-run, pathlib, yaml.safe_load]
key_files:
  created:
    - pipeline/config.yaml
    - pipeline/acquire_google.py
    - pyproject.toml
    - uv.lock
  modified: []
decisions:
  - "Use gallery-dl for Google Photos shared album download (handles auth natively, no selenium/requests needed)"
  - "Resolve config.yaml relative to __file__ so script works from any cwd"
  - "Path traversal guard via resolve() + ancestor check before passing output_dir to gallery-dl (T-01-02)"
  - "PLACEHOLDER sentinel in album_url forces explicit replacement before any download attempt"
metrics:
  duration: "138s"
  completed_date: "2026-05-16"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 0
---

# Phase 01 Plan 01: Photo Source Configuration and Google Photos Downloader Summary

**One-liner:** Config.yaml skeleton with photographer/source definitions plus a gallery-dl-based downloader that validates PLACEHOLDER album URLs before invoking any download.

## What Was Built

### Task 1: pipeline/config.yaml
Created the central pipeline configuration file with:
- `sources.google_photos`: 3 entries (photographer_a/b/c), each with PLACEHOLDER album_url and `sources/photographer_X` output_dir
- `sources.pic_time`: mapping pointing to `https://justsmile.pic-time.com/gallery` with `sources/pic_time` output_dir
- `photographers`: 3 entries with label and display_name placeholder values
- `pipeline.confidence_threshold: 0.7` for Phase 2 cluster review
- Instruction comments at top guiding replacement of PLACEHOLDER values and display names before launch

### Task 2: pipeline/acquire_google.py
Created a Python 3.13 downloader script with:
- Loads `pipeline/config.yaml` using `yaml.safe_load`, resolving config path relative to `__file__`
- Validates all `album_url` values do not contain "PLACEHOLDER" — exits 1 with per-label error messages if any remain
- Resolves `output_dir` values via `Path.resolve()` with an ancestor assertion against the project root (path traversal mitigation T-01-02)
- Creates output directories via `mkdir(parents=True, exist_ok=True)`
- Invokes `gallery-dl --dest <output_dir> --filename {filename} <album_url>` via `subprocess.run`; exits 1 on non-zero return code
- Prints a post-download summary with image file counts per album

Added `gallery-dl>=1.32.1` and `pyyaml>=6.0.3` to `pyproject.toml` via `uv add`. A `uv.lock` lockfile was generated for reproducible installs.

## Verification Results

```
OK: config.yaml structure valid (3 google_photos entries, correct pic-time URL, 3 photographers)
Placeholder detection: exits 1 and names each PLACEHOLDER label — PASS
Dependencies in pyproject.toml: gallery-dl>=1.32.1, pyyaml>=6.0.3 — PASS
```

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 — config.yaml | c0c10e9 | feat(01-01): create pipeline/config.yaml skeleton |
| 2 — acquire_google.py | 5586218 | feat(01-01): create pipeline/acquire_google.py Google Photos downloader |

## Deviations from Plan

### Auto-added

**1. [Rule 2 - Missing file] Copy pyproject.toml from main repo into worktree**
- **Found during:** Task 2
- **Issue:** The worktree branch was created from a commit that did not include pyproject.toml (it was untracked in the main repo). The plan required adding dependencies to pyproject.toml using `uv add`.
- **Fix:** Copied pyproject.toml from the main repo working directory into the worktree, then ran `uv add gallery-dl pyyaml` which updated it and generated uv.lock. Both files committed with Task 2.
- **Files modified:** pyproject.toml (copied + updated), uv.lock (generated)

None — plan executed as written (aside from pyproject.toml bootstrap above, which is a prerequisite, not a plan deviation).

## Known Stubs

- `album_url` values in `pipeline/config.yaml` are PLACEHOLDERs — the acquire_google.py script enforces replacement at runtime (exits 1 with informative error). These stubs are **intentional**: real album URLs should not be committed to version control.
- `display_name` values in `pipeline/config.yaml` are placeholders ("Photographer A/B/C") — will be updated to real names before Phase 3 upload.

## Threat Flags

None — no new network endpoints, auth paths, or file access patterns beyond what was planned. Path traversal mitigation T-01-02 was applied as required.

## Self-Check: PASSED
