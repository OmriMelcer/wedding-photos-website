---
phase: 09-downloads-album-links
plan: "02"
subsystem: site/frontend
tags: [download, photocard, rtl, vitest, lucide-react]
dependency_graph:
  requires: []
  provides: [DWNL-02]
  affects: [site/src/components/PhotoCard.jsx]
tech_stack:
  added: [lucide-react/Download icon]
  patterns: [hover overlay via Tailwind group-hover, logical CSS RTL (end-0)]
key_files:
  modified:
    - site/src/components/PhotoCard.jsx
  created:
    - site/tests/PhotoCard.test.jsx
decisions:
  - Use <a href download> with stopPropagation for native browser download — no JS fetch needed
  - Place anchor at bottom-0 end-0 (logical) to mirror badge at bottom-0 start-0 (both RTL-safe)
  - Query img via container.querySelector in PC5 test because alt="" yields role=presentation
metrics:
  duration: "~5 minutes"
  completed: "2026-05-23T15:51:11Z"
  tasks_completed: 1
  files_created: 1
  files_modified: 1
---

# Phase 9 Plan 02: PhotoCard Hover Download Overlay Summary

PhotoCard gains a hover-visible `<a download>` anchor at the bottom-end corner (RTL-safe) with an
`lucide-react` Download icon, `stopPropagation` to prevent lightbox from opening, and 8 Vitest tests
covering all DWNL-02 acceptance criteria.

## Files Modified

| File | Change |
|------|--------|
| `site/src/components/PhotoCard.jsx` | Added Download import + `<a>` anchor overlay |
| `site/tests/PhotoCard.test.jsx` | Created — 8 tests for DWNL-02 |

## PhotoCard Before / After Diff Highlights

**Before:**
- Single overlay: photographer credit badge at `bottom-0 start-0`
- No download affordance

**After:**
- Import `{ Download }` from `lucide-react` added at top of file
- New `<a>` anchor after the photographer badge:
  - `href={photo.r2_url}` / `download={photo.filename}`
  - `aria-label="הורד תמונה"`
  - `onClick={(e) => e.stopPropagation()}` prevents lightbox open
  - `className="absolute bottom-0 end-0 m-1.5 p-1.5 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus-visible:opacity-100"`
  - Contains `<Download className="size-4" aria-hidden="true" />`
- Photographer badge unchanged (still `pointer-events-none`, `start-0`)

## Test Results

```
PASS  tests/PhotoCard.test.jsx (8 tests)
  PC1: renders anchor with href === photo.r2_url
  PC2: download attribute equals photo.filename
  PC3: aria-label="הורד תמונה"
  PC4: clicking download anchor does NOT invoke onClick prop (stopPropagation)
  PC5: clicking card (not download anchor) DOES invoke onClick prop
  PC6: anchor className contains end-0 and bottom-0
  PC7: anchor className contains opacity-0 and group-hover:opacity-100
  PC8: no left-/right-/ml-/mr-/pl-/pr- classes (RTL contract)

Full suite: 8 test files, 40 tests — all pass
```

## Deviations from Plan

**1. [Rule 1 - Bug] Test PC5 adjusted to query img by container.querySelector**
- **Found during:** Task 1 (first test run)
- **Issue:** Plan specified `screen.getByRole('img')` but the `<img alt="">` has role `presentation` (not `img`) because of the empty `alt` attribute — a correct accessibility pattern for decorative images.
- **Fix:** Used `container.querySelector('img')` instead of `screen.getByRole('img')`. Test intent preserved: verifying that clicking the image area (not the download anchor) fires `onClick`.
- **Files modified:** `site/tests/PhotoCard.test.jsx`
- **Commit:** 2a1df58

## Known Stubs

None.

## Self-Check

- [x] `site/src/components/PhotoCard.jsx` modified — exists
- [x] `site/tests/PhotoCard.test.jsx` created — exists
- [x] Commit `2a1df58` exists
- [x] All 8 acceptance criteria grep checks pass
- [x] Full test suite green (40/40)
