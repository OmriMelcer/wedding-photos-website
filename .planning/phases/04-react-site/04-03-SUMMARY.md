---
phase: 04-react-site
plan: "03"
subsystem: site-components
tags:
  - components
  - gallery
  - filters
  - lightbox
  - masonry
  - shadcn
  - tailwind
  - rtl
  - hebrew
dependency_graph:
  requires:
    - 04-01  # Vite + React + Tailwind + shadcn baseline, config.js
    - 04-02  # usePhotos + useFilters hooks
  provides:
    - All 9 UI components: App, Filters, Gallery, GallerySection, PhotoCard, Lightbox, LoadingSkeleton, ErrorState, EmptyState
    - FILT-04, GALL-02, GALL-03, GALL-04 test coverage
  affects:
    - 04-04  # Visual verification plan consumes this build
tech_stack:
  added:
    - yet-another-react-lightbox (yarl) v3.32.0 — lightbox wrapper
    - react-masonry-css v1.0.16 — CSS-only masonry grid
  patterns:
    - Conditional render for face filter (not display:none) — FILT-04
    - PHASE_ORDER iteration in Gallery (not Object.keys) — GALL-02
    - flatFilteredPhotos as yarl slides (not all photos) — GALL-04
    - RTL logical utilities exclusively (ps-/pe-/ms-/me-/start-/end-) — I18N contract
    - Badge at start-0 = visual bottom-right in RTL context — D-13
key_files:
  created:
    - site/src/components/Filters.jsx
    - site/src/components/Gallery.jsx
    - site/src/components/GallerySection.jsx
    - site/src/components/PhotoCard.jsx
    - site/src/components/Lightbox.jsx
    - site/src/components/LoadingSkeleton.jsx
    - site/src/components/ErrorState.jsx
    - site/src/components/EmptyState.jsx
    - site/tests/Filters.test.jsx
    - site/tests/Gallery.test.jsx
    - site/tests/Lightbox.test.jsx
  modified:
    - site/src/App.jsx  # replaced stub with full wired root
    - site/tests/smoke.test.jsx  # updated assertion for new App loading state
decisions:
  - "Badge positioning: start-0 (not end-0) for visual RTL bottom-right per D-13 — in RTL, start resolves to right"
  - "Lightbox import renamed to YarlLightbox to avoid collision with wrapper function name LightboxWrapper"
  - "vi.mock factory pattern used for yarl mock to avoid temporal dead zone with module-level const"
  - "Smoke test updated from stub text assertion to role=status assertion (LoadingSkeleton) on App replacement"
metrics:
  completed_date: "2026-05-16"
  tasks_completed: 2
  files_created: 11
  files_modified: 2
  tests_added: 9
  tests_total: 32
---

# Phase 4 Plan 3: Gallery Components + Tests Summary

**One-liner:** All 9 gallery components implemented with RTL Hebrew UI, yarl lightbox wired to filtered photo slides, and 9 new Vitest tests covering FILT-04/GALL-02/GALL-03/GALL-04.

## What Was Built

### Task 1: All 9 Components

**App.jsx** — replaced stub entirely. Wires `usePhotos` + `useFilters`, owns `lightboxIndex` state, conditionally renders `LoadingSkeleton`/`ErrorState`/main layout with Filters + Gallery + LightboxWrapper.

**Filters.jsx** — sticky `top-0 z-10` bar. Three chip groups: photographers (PHOTOGRAPHER_NAMES), phases (PHASE_ORDER/PHASE_LABELS), optional face filter. Face filter is `&&`-conditional (absent from DOM when `people.length === 0`, per FILT-04). Clear-all shadcn Button labeled "הצג הכל" only when hasActiveFilters.

**Gallery.jsx** — iterates `PHASE_ORDER` (not `Object.keys`), sections with 0 photos return `null` (not hidden divs, per D-05). Shows `EmptyState` when all phases are empty.

**GallerySection.jsx** — sticky header at `top-16` with Hebrew phase title + `(N תמונות)` count. `react-masonry-css` grid with `BREAKPOINT_COLS = { default:5, 1280:5, 1024:4, 640:3, 0:2 }`. PhotoCards use `flatFilteredPhotos.indexOf(photo)` for lightbox index.

**PhotoCard.jsx** — `<img loading="lazy">` (mandatory). Hover badge at `bottom-0 start-0` — in RTL, `start-0` resolves to `right:0`, placing badge at visual bottom-right (D-13). Uses `PHOTOGRAPHER_NAMES[photo.photographer]` not raw key (D-14).

**Lightbox.jsx** — yarl wrapper (imported as `YarlLightbox` to avoid name collision). Slides mapped from `flatFilteredPhotos` as `{ src: r2_url, alt: id }`. Portal config `{ container: { dir: 'rtl' } }` for RTL nav arrows.

**LoadingSkeleton.jsx** — 12 `animate-pulse` stone-200 cards with alternating 3/4, 4/3, 1/1 aspect ratios. `role="status"` + `aria-label="טוען תמונות..."`.

**ErrorState.jsx** — `role="alert"`, Hebrew headings `לא ניתן לטעון את התמונות` / `אירעה שגיאה בטעינת האלבום. אפשר לנסות לרענן את הדף.`, shadcn `<Button>` labeled "רענן".

**EmptyState.jsx** — centered `אין תמונות התואמות לסינון הנוכחי`.

### Task 2: Component Tests (9 new tests)

**Filters.test.jsx (4 tests):**
- F1: `people=[]` → `queryByTestId('face-filter')` is null (FILT-04 absence)
- F2: `people=[{id:'p1'}]` → `data-testid="face-filter"` in DOM (FILT-04 presence)
- F3: all 3 photographer chips + all 5 phase chips render with correct Hebrew labels
- F4: empty Sets → "הצג הכל" absent; active filter → present; click calls onClearAll

**Gallery.test.jsx (3 tests):**
- G1: all 5 phases non-empty → h2 headings in PHASE_ORDER order with PHASE_LABELS text (GALL-02)
- G2: 2 phases empty → exactly 3 h2 in DOM, empty phase labels absent from document (D-05)
- G3: all phases empty → EmptyState "אין תמונות התואמות לסינון הנוכחי" rendered

**Lightbox.test.jsx (2 tests):**
- L1: click photo → yarl mock called with `open:true`, correct `index`, `slides` matching all 5 flatFilteredPhotos mapped to `{src, alt}` (GALL-03 + GALL-04)
- L2: filter activates, click 2nd matching photo → `slides.length===3`, `index===1`, only filtered r2_urls in slides, excluded photos absent (GALL-04 subset)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Smoke test assertion updated for replaced App.jsx stub**
- **Found during:** Task 1 implementation
- **Issue:** `smoke.test.jsx` asserted `screen.getByText(/האלבום שלנו/)` which was only present in the Plan-01 stub. Replacing App.jsx with the real implementation (shows LoadingSkeleton during fetch) caused the smoke test to fail.
- **Fix:** Updated assertion to `screen.getByRole('status')` which matches LoadingSkeleton's `role="status"` element.
- **Files modified:** `site/tests/smoke.test.jsx`
- **Commit:** 0fa581a

**2. [Rule 1 - Bug] yarl import renamed to avoid name collision**
- **Found during:** Task 1 - Lightbox.jsx implementation
- **Issue:** Importing `Lightbox` from 'yet-another-react-lightbox' while also naming the wrapper function `LightboxWrapper` (default export) would create a naming conflict in the same file.
- **Fix:** Import renamed to `YarlLightbox` — matches the pattern intent while avoiding shadowing.
- **Files modified:** `site/src/components/Lightbox.jsx`

**3. [Rule 1 - Bug] vi.mock factory pattern for Lightbox test**
- **Found during:** Task 2 - Lightbox.test.jsx
- **Issue:** Plan specified `const yarlMock = vi.fn(() => null)` at module scope before `vi.mock(...)`. Vitest hoists `vi.mock()` above variable declarations, causing `ReferenceError: Cannot access 'yarlMock' before initialization`.
- **Fix:** Moved mock function creation inside the factory: `vi.mock('yet-another-react-lightbox', () => { const mockFn = vi.fn(() => null); return { default: mockFn }; })`. Retrieve reference via `vi.mocked(YarlModule.default)` after import.
- **Files modified:** `site/tests/Lightbox.test.jsx`

## Known Stubs

- `<div data-testid="face-filter">{/* Phase 2 — face filter UI */}</div>` in `Filters.jsx` — intentional placeholder per spec. Phase 2 populates `people[]` and wires face filter UI with no frontend code changes required (FILT-04 design).

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes introduced. This plan is purely client-side React rendering consuming pre-fetched `metadata.json`.

## Verification Results

```
✓ npm run build — exits 0
✓ npm test -- --run — 32/32 tests pass (7 test files)
✓ grep 'people.length > 0' Filters.jsx — FILT-04 conditional
✓ grep 'loading="lazy"' PhotoCard.jsx — perf invariant
✓ grep 'start-0' PhotoCard.jsx — D-13 badge at visual RTL bottom-right
✓ grep 'PHASE_ORDER' Gallery.jsx — D-04 iteration source
✓ grep 'react-masonry-css' GallerySection.jsx — masonry dependency
✓ grep 'yet-another-react-lightbox' Lightbox.jsx — yarl import
✓ No pl-/pr-/ml-/mr- in components/*.jsx — logical utilities only
```

## Self-Check: PASSED

All created files verified to exist. All commits verified in git log.
