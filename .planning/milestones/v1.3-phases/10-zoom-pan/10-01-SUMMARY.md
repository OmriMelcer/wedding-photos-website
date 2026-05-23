---
phase: "10"
plan: "01"
subsystem: site/src/components/Lightbox.jsx
tags: [zoom, lightbox, yarl, tdd, react]
dependency_graph:
  requires: []
  provides: [ZOOM-01, ZOOM-02, ZOOM-03]
  affects: [site/src/components/Lightbox.jsx, site/tests/Lightbox.test.jsx]
tech_stack:
  added: []
  patterns: [yarl Zoom plugin via sub-path import from existing package, TDD RED/GREEN]
key_files:
  created: []
  modified:
    - site/src/components/Lightbox.jsx
    - site/tests/Lightbox.test.jsx
decisions:
  - plugins=[Zoom, Download] order: Zoom before Download so zoom controls land on outer end of RTL toolbar
  - maxZoomPixelRatio:3 mandatory: default of 1 silently disables zoom on all retina/mobile devices
  - pinchZoomV4:true mandatory: prevents iOS swipe-block after fast pinch-out (yarl bug fixed in v3.27.0)
  - Hebrew zoom labels deferred: "Zoom in"/"Zoom out" keys not added per REQUIREMENTS.md out-of-scope decision
metrics:
  duration: "3 minutes"
  completed: "2026-05-23"
  tasks_completed: 2
  files_changed: 2
---

# Phase 10 Plan 01: Wire yarl Zoom Plugin Summary

**Status:** Complete
**Plan:** Wire yarl Zoom plugin (ZOOM-01/02/03)
**One-liner:** yarl Zoom plugin wired with `maxZoomPixelRatio: 3` and `pinchZoomV4: true` — delivers pinch-to-zoom, scroll-wheel zoom, and drag-to-pan from the already-installed `yet-another-react-lightbox@^3.32.0`.

## What was done

Added the Zoom plugin from `yet-another-react-lightbox/plugins/zoom` (no new npm package — ships inside the already-installed `yet-another-react-lightbox@^3.32.0`) to `LightboxWrapper`:

**`site/src/components/Lightbox.jsx`:**
- Added import: `import Zoom from 'yet-another-react-lightbox/plugins/zoom';`
- Changed `plugins={[Download]}` to `plugins={[Zoom, Download]}` (Zoom first for RTL toolbar order)
- Added `zoom={{ scrollToZoom: true, maxZoomPixelRatio: 3, pinchZoomV4: true, doubleClickMaxStops: 2 }}`
- Updated top comment block to document why `maxZoomPixelRatio: 3` and `pinchZoomV4: true` are mandatory
- No CSS import added (Zoom plugin has no separate CSS in v3.32.0)
- `labels` prop unchanged: `{ Download: 'הורדה' }` only — Hebrew zoom labels are deferred scope

**`site/tests/Lightbox.test.jsx`:**
- Added `vi.mock('yet-another-react-lightbox/plugins/zoom', () => ({ default: 'ZoomPluginMock' }))` immediately after the download mock (module-level, hoisted by Vitest)
- Added `describe('Lightbox (ZOOM-01/02/03)')` block with combined Z1/Z2/Z3 test:
  - Z1: plugins contains `'ZoomPluginMock'`
  - Z2: ZoomPluginMock index < DownloadPluginMock index (RTL toolbar order)
  - Z3: `zoom` prop deep-equals `{ scrollToZoom: true, maxZoomPixelRatio: 3, pinchZoomV4: true, doubleClickMaxStops: 2 }`

## Test results

| Command | Exit code |
|---------|-----------|
| `npx vitest run tests/Lightbox.test.jsx` (RED — before GREEN) | 1 (1 failing, 5 passing — expected) |
| `npx vitest run tests/Lightbox.test.jsx` (GREEN — after GREEN) | 0 (6/6 passing) |
| `npx vitest run` (full suite) | 0 (53/53 passing across 9 test files) |
| `npm run build` | 0 (clean Vite production build, 277.55 kB JS) |
| `npm run lint` | 12 pre-existing errors in unrelated files (see Deferred Items) |

## Commits

| Task | Hash | Message |
|------|------|---------|
| Task 1 (RED) | 30e7b17 | test(10-01): add ZOOM-01/02/03 assertions to Lightbox.test.jsx (RED) |
| Task 2 (GREEN) | a59189d | feat(10-01): wire yarl Zoom plugin for pinch-to-zoom, scroll zoom, and drag-to-pan (ZOOM-01/02/03) |

## Final prop values (as committed)

```jsx
plugins={[Zoom, Download]}
zoom={{ scrollToZoom: true, maxZoomPixelRatio: 3, pinchZoomV4: true, doubleClickMaxStops: 2 }}
labels={{ Download: 'הורדה' }}
```

## Verification

- Zero new npm packages installed: confirmed (`site/package.json` unchanged — Zoom plugin is a sub-path export of already-installed `yet-another-react-lightbox@^3.32.0`)
- `plugins={[Zoom, Download]}` confirmed via grep
- All four zoom config keys confirmed via grep
- No CSS import for zoom plugin (it has none in v3.32.0)
- No `react-zoom-pan-pinch`, `hammerjs`, or other gesture library added

## Deviations from Plan

### Pre-existing Lint Errors (Out of Scope)

`npm run lint` reports 12 errors in files not part of this plan:
- `site/tests/useFilters.test.js:207` — `'global' is not defined`
- `site/tests/usePhotos.test.js` (7 errors) — `'global' is not defined`, unused `beforeEach`
- `site/vite.config.js:10` — `'__dirname' is not defined`
- `site/worker.js:17` — useless escape character

Verified identical errors existed before this plan's changes (confirmed via `git stash` test). Zero new lint errors introduced by this plan. These are deferred to a future maintenance task.

## Next Step

Manual smoke testing is in `10-02-PLAN.md` (blocking human-verify checkpoint):
- iPhone pinch-to-zoom
- Swipe-after-pinch-out (tests `pinchZoomV4: true` fix)
- Desktop scroll-wheel zoom
- Drag-to-pan while zoomed in
- RTL toolbar visual check (Zoom controls on outer end)

## Self-Check: PASSED

- [x] `site/src/components/Lightbox.jsx` exists and contains Zoom import
- [x] `site/tests/Lightbox.test.jsx` exists and contains `ZoomPluginMock`
- [x] Commit `30e7b17` exists (RED)
- [x] Commit `a59189d` exists (GREEN)
- [x] All 53 tests pass across 9 test files
- [x] Production build exits 0
