---
phase: "01-photo-acquisition"
plan: "03"
subsystem: "docs"
tags: ["documentation", "manual-download", "google-photos", "pic-time", "acquisition"]
dependency_graph:
  requires: ["01-01", "01-02"]
  provides: ["docs/manual-download.md"]
  affects: []
tech_stack:
  added: []
  patterns: ["documentation"]
key_files:
  created:
    - docs/manual-download.md
  modified: []
decisions:
  - "Numbered steps for sequential download actions; bullet points for options/alternatives per plan spec"
  - "References pipeline/config.yaml as the authoritative source for album URLs (not hardcoded PLACEHOLDERs)"
  - "Includes wget/DevTools alternative for pic-time in case bulk download is unavailable"
metrics:
  duration: "~3 minutes"
  completed_date: "2026-05-16"
  tasks_completed: 1
  tasks_total: 1
  files_created: 1
  files_modified: 0
---

# Phase 01 Plan 03: Manual Download Fallback Guide Summary

**One-liner:** Manual fallback documentation for Google Photos and pic-time downloads, producing the same folder structure as the automated scripts so all subsequent pipeline stages run identically.

## What Was Built

Created `docs/manual-download.md` — a step-by-step manual download guide used when `acquire_google.py` or `acquire_pictime.py` fails. The document covers:

- **When to Use This Guide:** Intro paragraph explaining the guide is for automated script failures.
- **Source Folder Structure:** Table showing required `sources/photographer_a/`, `sources/photographer_b/`, `sources/photographer_c/`, and `sources/pic_time/` folder paths with notes that these names are read from `pipeline/config.yaml`.
- **Google Photos Manual Download:** Numbered steps covering album URL lookup from `pipeline/config.yaml`, select-all + download-ZIP flow, ZIP extraction into the correct folder per label, and a note with `find`-based commands to flatten any date-based subfolders Google Photos creates.
- **pic-time Manual Download:** Numbered steps for opening `https://justsmile.pic-time.com/gallery`, using the bulk download button, and a fallback approach using right-click save. Alternative section covering `wget` + browser DevTools for galleries that render images via JavaScript.
- **Verification After Manual Download:** `find` and `ls | wc -l` commands to confirm each folder is populated, with a note that the remainder of the pipeline is identical after manual download.

## Verification Results

```
grep -c "## Google Photos Manual Download" docs/manual-download.md  → 1  (PASS)
grep -c "## pic-time Manual Download" docs/manual-download.md       → 1  (PASS)
grep -c "sources/photographer_a" docs/manual-download.md            → 4  (PASS)
wc -l docs/manual-download.md                                       → 94 (PASS: >= 60)

Additional checks:
## When to Use This Guide                → 1  (PASS)
## Source Folder Structure               → 1  (PASS)
## Verification After Manual Download    → 1  (PASS)
sources/photographer_b                   → 4  (PASS)
sources/photographer_c                   → 4  (PASS)
sources/pic_time                         → 6  (PASS)
pipeline/config.yaml references          → 4  (PASS)
https://justsmile.pic-time.com/gallery   → 2  (PASS)
Numbered steps (^1\.)                    → 3  (PASS)
```

All acceptance criteria passed.

## Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `docs/manual-download.md` | Created | 94-line manual download fallback guide |

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 — docs/manual-download.md | 133d239 | docs(01-03): write manual download fallback guide |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — the document references `PLACEHOLDER` album URLs as intentional (the guide instructs users to look them up in `pipeline/config.yaml`, where they must be filled in before use).

## Threat Flags

None — documentation file only; no new network endpoints, auth paths, or file access patterns introduced.

## Self-Check: PASSED
- `docs/manual-download.md` exists: confirmed
- Commit 133d239 exists: confirmed
