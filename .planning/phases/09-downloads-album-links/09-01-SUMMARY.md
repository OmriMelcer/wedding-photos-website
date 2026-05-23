---
phase: 09-downloads-album-links
plan: "01"
subsystem: site/frontend
tags:
  - react
  - rtl
  - config
dependency_graph:
  requires: []
  provides:
    - ALBUM_LINKS config export
    - TopBar component
  affects:
    - site/src/App.jsx
    - site/src/config.js
tech_stack:
  added: []
  patterns:
    - Button asChild pattern for anchor-as-button
    - nav landmark with aria-label for RTL album links bar
key_files:
  created:
    - site/src/components/TopBar.jsx
    - site/tests/TopBar.test.jsx
  modified:
    - site/src/config.js
    - site/tests/config.test.js
    - site/src/App.jsx
decisions:
  - TopBar nav wrapper uses a child div for the flex layout (nav itself does not carry flex classes) — keeps semantic element clean
  - No justify-end/justify-start on the flex row; default flex flow places items at inline-start which renders on the visual right in RTL
metrics:
  duration: "~10 minutes"
  completed: "2026-05-23"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 3
---

# Phase 9 Plan 01: TopBar Album Links Summary

ALBUM_LINKS config export and TopBar component with 4 source-album link buttons rendered above the Filters bar, using Button asChild with anchor elements for correct RTL layout.

## Files Created / Modified

### Created
- `site/src/components/TopBar.jsx` — nav landmark wrapping 4 ALBUM_LINKS buttons (Button asChild + ExternalLink icon)
- `site/tests/TopBar.test.jsx` — 5 tests: nav role, link count, rel/target, href, label text

### Modified
- `site/src/config.js` — added `ALBUM_LINKS` named export (4 entries, placeholder URLs)
- `site/tests/config.test.js` — added `describe('ALBUM_LINKS')` block with 5 new tests
- `site/src/App.jsx` — imported TopBar; renders `<TopBar />` before `<Filters>`

## ALBUM_LINKS Entries

| # | Label | URL |
|---|-------|-----|
| 1 | אביר סולטן | `#` (placeholder — replace with Google Photos album URL) |
| 2 | ענבל זלדין | `#` (placeholder — replace with Google Photos album URL) |
| 3 | מגנטים | `#` (placeholder — replace with Google Photos album URL) |
| 4 | Pic-Time | `#` (placeholder — replace with Pic-Time album URL) |

Note: All URLs are `'#'` placeholders per CONF-01. Replace in `site/src/config.js` before deployment.

## Test Counts

| File | Tests |
|------|-------|
| config.test.js | 11 (6 pre-existing + 5 new ALBUM_LINKS tests) |
| TopBar.test.jsx | 5 (new) |
| Full suite | 42 across 8 files — all passing |

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | dab4a74 | feat(09-01): add ALBUM_LINKS export to config.js |
| Task 2 | 5ec9ac9 | feat(09-01): create TopBar component with album link buttons |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

| File | Line | Description |
|------|------|-------------|
| site/src/config.js | 24-29 | All 4 ALBUM_LINKS entries have `url: '#'` — intentional placeholder per CONF-01. Must be replaced with real album URLs before sharing the site with guests. |

## Self-Check: PASSED
