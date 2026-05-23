---
phase: 09-downloads-album-links
plan: "03"
subsystem: site/lightbox
tags: [download, yarl, lightbox, dwnl-01]
dependency_graph:
  requires: []
  provides: [DWNL-01]
  affects: [site/src/components/Lightbox.jsx, site/tests/Lightbox.test.jsx]
tech_stack:
  added: []
  patterns: [yarl-download-plugin, download-object-form]
key_files:
  created: []
  modified:
    - site/src/components/Lightbox.jsx
    - site/tests/Lightbox.test.jsx
decisions:
  - Used modern `download: { url, filename }` object form per yarl plugin API (not deprecated `downloadUrl`/`downloadFilename` string properties)
  - Set `labels={{ Download: 'הורדה' }}` on YarlLightbox for Hebrew toolbar tooltip
metrics:
  duration: "~2 minutes"
  completed: "2026-05-23"
  tasks_completed: 1
  files_modified: 2
---

# Phase 9 Plan 03: yarl Download Plugin Summary

**One-liner:** Added yarl Download plugin to LightboxWrapper with per-slide `download: { url, filename }` metadata and Hebrew toolbar label, satisfying DWNL-01.

## What Was Built

Integrated the `yet-another-react-lightbox` Download plugin into the existing `LightboxWrapper` component. Guests viewing photos in the lightbox now have a download button in the toolbar that saves the currently viewed photo using the original R2 URL and filename.

## Files Modified

### site/src/components/Lightbox.jsx

- Added `import Download from 'yet-another-react-lightbox/plugins/download'`
- Extended `yarlSlides` map to include `download: { url: photo.r2_url, filename: photo.filename }` per slide
- Added `plugins={[Download]}` prop to `<YarlLightbox />`
- Added `labels={{ Download: 'הורדה' }}` prop for Hebrew toolbar tooltip
- Preserved all existing props: `open`, `close`, `slides`, `index`, `portal={{ container: { dir: 'rtl' } }}`

### site/tests/Lightbox.test.jsx

- Added top-level `vi.mock('yet-another-react-lightbox/plugins/download', ...)` mock
- Updated L1 `expectedSlides` assertion to include `download: { url, filename }` on each slide
- Added `describe('Lightbox (DWNL-01)')` block with three new tests:
  - D1: plugins array contains DownloadPluginMock
  - D2: every slide has `download.url === r2_url` and `download.filename === filename`
  - D3: `labels.Download === 'הורדה'`

## Plugin Integration Notes

The yarl Download plugin is loaded via the `plugins` prop array pattern standard across yarl v3+. Each slide carries `download: { url, filename }` in the object form — the modern API confirmed in `dist/plugins/download/index.d.ts`. The `filename` comes from `photo.filename` which maps to the original uploaded filename in `metadata.json`.

The Hebrew label `'הורדה'` (transliteration: "horada", meaning "download") is passed via `labels.Download` as defined in the yarl `Labels` interface.

## Test Results

All tests pass:
- Test files: 7 passed
- Total tests: 35 passed (including 3 new DWNL-01 tests and updated L1 assertion)

## Deviations from Plan

### API Form Clarification

**Issue:** Plan noted the use of `download: { url, filename }` object form and flagged it as the correct modern API.

**Confirmation:** The yarl type definitions confirm `downloadUrl`/`downloadFilename` are marked `@deprecated` and the `download: { url: string; filename: string }` object form is the current API. Used as specified.

No other deviations — plan executed exactly as written.

## Threat Flags

None. This change adds no new network endpoints, auth paths, file access patterns, or schema changes. The download URL is the R2 URL already present in `metadata.json` and already loaded client-side.

## Self-Check: PASSED

- site/src/components/Lightbox.jsx: modified and committed
- site/tests/Lightbox.test.jsx: modified and committed
- Commit 7e6c11a exists and contains both files
- All 35 tests pass in full suite
