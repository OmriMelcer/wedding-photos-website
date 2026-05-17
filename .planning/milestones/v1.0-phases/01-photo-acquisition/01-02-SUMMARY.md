---
phase: "01-photo-acquisition"
plan: "02"
subsystem: "pipeline"
tags: ["acquisition", "pic-time", "gallery-dl", "downloader"]
dependency_graph:
  requires: []
  provides: ["pipeline/acquire_pictime.py", "pic-time photo download capability"]
  affects: ["sources/pic_time/"]
tech_stack:
  added: ["gallery-dl>=1.27.0", "requests>=2.32.0", "beautifulsoup4>=4.12.0"]
  patterns: ["subprocess invocation", "automatic fallback", "Path(__file__) relative resolution"]
key_files:
  created:
    - pipeline/acquire_pictime.py
    - pyproject.toml
  modified: []
decisions:
  - "gallery-dl as primary downloader with automatic fallback to requests+BeautifulSoup when gallery-dl produces zero files"
  - "Added --fallback flag to force fallback mode explicitly"
  - "pyproject.toml created in worktree with gallery-dl, requests, beautifulsoup4 dependencies"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-16"
---

# Phase 01 Plan 02: Pic-Time Gallery Downloader Summary

## One-liner

pic-time gallery downloader using gallery-dl with automatic requests+BeautifulSoup fallback when gallery-dl produces zero files.

## What Was Built

Created `pipeline/acquire_pictime.py` — a Python 3.13 script that downloads all photos from the open-access `justsmile.pic-time.com/gallery` pic-time gallery into `sources/pic_time/`.

**Primary strategy:** Invokes `gallery-dl` via `subprocess.run` with `--dest` and `--filename` flags. gallery-dl natively discovers the pic-time gallery structure from the URL — no cookies or authentication required for open-access galleries.

**Automatic fallback:** If gallery-dl returns a non-zero exit code OR produces zero image files, the script automatically switches to a `requests` + `BeautifulSoup` fallback that:
1. Fetches the gallery HTML page
2. Parses all `<img>` `src`/`data-src`/`data-original` attributes referencing `pic-time.com`
3. Downloads each image into `OUTPUT_DIR`

**`--fallback` flag:** Users can force the fallback path with `uv run python pipeline/acquire_pictime.py --fallback`.

Constants are hardcoded at the top of the file (not config-driven) since URL and output path are fixed known values.

## Verification Results

All acceptance criteria passed:

- `pipeline/acquire_pictime.py` exists and contains `def main(`
- File contains `if __name__ == "__main__": main()` pattern
- File contains `"https://justsmile.pic-time.com/gallery"` as the gallery URL
- File contains `subprocess.run` for invoking gallery-dl
- File contains `sources/pic_time` as the output directory
- File contains `mkdir` call for creating OUTPUT_DIR
- Script resolves OUTPUT_DIR relative to `__file__` via `Path(__file__).parent.parent`
- `python3 -m py_compile pipeline/acquire_pictime.py` passes with "syntax OK"

## Key Decisions

1. **gallery-dl as primary, requests+BS4 as fallback:** gallery-dl supports many gallery sites natively; fallback covers cases where pic-time gallery structure is not recognized or requires JavaScript rendering for URL discovery.

2. **Automatic fallback on zero files:** Rather than requiring `--fallback` when gallery-dl silently fails, the script detects zero output and switches automatically.

3. **pyproject.toml with all three dependencies:** Added `gallery-dl`, `requests`, and `beautifulsoup4` since both the primary and fallback paths may be needed. The concurrent 01-01 agent was working on config.yaml only (no pyproject.toml changes observed) at commit time.

## Deviations from Plan

None — plan executed exactly as written. The fallback implementation was explicitly specified in the plan as required behavior.

## Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `pipeline/acquire_pictime.py` | Created | Main downloader script (162 lines) |
| `pyproject.toml` | Created | Python project manifest with gallery-dl, requests, beautifulsoup4 dependencies |

## Commits

| Hash | Message |
|------|---------|
| ab8b0bf | feat(01-02): create pipeline/acquire_pictime.py pic-time downloader |

## Status: COMPLETE
