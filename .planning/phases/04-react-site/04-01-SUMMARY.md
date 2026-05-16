---
phase: 04-react-site
plan: "01"
subsystem: site
tags:
  - vite
  - tailwind-v4
  - shadcn-ui
  - rtl
  - hebrew
  - react-19
  - vitest
dependency_graph:
  requires: []
  provides:
    - site/package.json
    - site/vite.config.js
    - site/jsconfig.json
    - site/index.html
    - site/src/index.css
    - site/src/main.jsx
    - site/src/App.jsx
    - site/src/config.js
    - site/src/components/ui/button.jsx
    - site/public/metadata.json
    - site/tests/setup.js
    - site/tests/config.test.js
    - site/tests/smoke.test.jsx
  affects:
    - Plans 02, 03, 04 (all depend on this scaffold)
tech_stack:
  added:
    - React 19.2.6
    - Vite 8.0
    - Tailwind CSS v4 (CSS-first, @tailwindcss/vite plugin, no tailwind.config.js)
    - shadcn/ui nova preset (Button component)
    - Vitest 4.x + @testing-library/react + jsdom
    - react-masonry-css 1.0.16
    - yet-another-react-lightbox 3.32.0
    - "@fontsource/heebo 5.x"
    - tw-animate-css 1.4.0
  patterns:
    - CSS-first Tailwind v4 with @theme block for custom tokens
    - @ path alias (jsconfig.json + vite.config.js resolve.alias)
    - Vitest config embedded in vite.config.js under test key
    - Synthetic metadata.json fixture for local dev (picsum.photos seeds)
key_files:
  created:
    - site/package.json
    - site/package-lock.json
    - site/index.html
    - site/vite.config.js
    - site/jsconfig.json
    - site/components.json
    - site/src/index.css
    - site/src/main.jsx
    - site/src/App.jsx
    - site/src/config.js
    - site/src/components/ui/button.jsx
    - site/src/lib/utils.js
    - site/public/metadata.json
    - site/tests/setup.js
    - site/tests/config.test.js
    - site/tests/smoke.test.jsx
  modified: []
decisions:
  - "Used shadcn nova preset (--preset nova) to avoid interactive prompts; preset uses neutral OKLCH palette compatible with our stone theme"
  - "shadcn nova preset added @fontsource-variable/geist; we override --font-sans in @theme inline block to use Heebo instead"
  - "shadcn added @import shadcn/tailwind.css to index.css; this is kept as it provides the OKLCH CSS variable definitions for shadcn components"
  - "Vitest config embedded in vite.config.js (not a separate vitest.config.js) per plan requirement"
  - "PHASE_ORDER follows actual wedding timeline: prep, photoshooting, dining, hupa, dancing"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-17"
  tasks_completed: 2
  files_created: 16
---

# Phase 04 Plan 01: Vite + React 19 + Tailwind v4 + shadcn baseline with Hebrew RTL shell

**One-liner:** Vite 8 + React 19 scaffold with Tailwind v4 CSS-first config, shadcn/ui nova preset, Heebo font, Hebrew RTL HTML shell, canonical config.js, 15-photo synthetic fixture, and Vitest Wave-0 test infrastructure — all green.

## What Was Built

A complete `site/` directory scaffolded from scratch:

**Infrastructure**
- `site/package.json`: All runtime + dev deps installed (react 19, tailwindcss 4, shadcn, react-masonry-css, yet-another-react-lightbox, @fontsource/heebo, tw-animate-css, vitest, @testing-library/react, jsdom)
- `site/vite.config.js`: `@vitejs/plugin-react` + `@tailwindcss/vite`, `@` alias to `./src`, Vitest jsdom config embedded in `test` key
- `site/jsconfig.json`: `@/*` → `./src/*` path alias for shadcn import resolution in JavaScript project

**HTML Shell (I18N-02)**
- `site/index.html`: `<html lang="he" dir="rtl">`, `<title>האלבום שלנו</title>` — RTL foundation established at HTML root

**Styles (DSGN-01)**
- `site/src/index.css`: `@import "tailwindcss"` (v4 single import), `@fontsource/heebo` 400+600, `tw-animate-css`, `@theme` block with warm-gold accent and Heebo font, masonry-grid flex CSS with responsive gap breakpoints

**shadcn/ui Baseline (DSGN-01)**
- `site/components.json`: shadcn nova preset config
- `site/src/components/ui/button.jsx`: shadcn Button component (Radix/OKLCH palette)
- `site/src/lib/utils.js`: shadcn `cn()` utility

**App Entry Points**
- `site/src/main.jsx`: React 19 `createRoot` mount with `StrictMode`, `@/index.css` + `@/App` imports
- `site/src/App.jsx`: Minimal stub rendering 'האלבום שלנו' (full wiring in Plan 03)

**Config (I18N-03)**
- `site/src/config.js`: Canonical exports — `PHASE_LABELS` (5 Hebrew names), `PHASE_ORDER` (wedding timeline), `PHOTOGRAPHER_NAMES` (3 keys matching metadata.json), `METADATA_URL`

**Dev Fixture**
- `site/public/metadata.json`: 15 photos — 3 per phase × 5 phases, rotating through all 3 photographers, all 10 schema fields, empty `people[]`, picsum.photos placeholder images with varied aspect ratios

**Test Infrastructure**
- `site/tests/setup.js`: `@testing-library/jest-dom` global setup
- `site/tests/config.test.js`: 7 assertions covering all 4 config.js exports (I18N-03)
- `site/tests/smoke.test.jsx`: App smoke test — renders without throwing, Hebrew title in document

## Verification Gates Passed

All gates green:

- `cd site && npm run build` — exits 0, produces dist/index.html (190KB JS, 30KB CSS)
- `cd site && npm test -- --run` — 7 tests pass across config.test.js and smoke.test.jsx
- `grep -q 'dir="rtl"' site/index.html` — PASS
- `grep -q 'lang="he"' site/index.html` — PASS
- `cat site/public/metadata.json | python3 -m json.tool` — valid JSON
- `test -f site/src/components/ui/button.jsx` — PASS
- `grep -q 'PHASE_ORDER' site/src/config.js` — PASS
- `grep -q 'abir_sultan' site/src/config.js` — PASS
- `grep -q '@import "tailwindcss"' site/src/index.css` — PASS
- `grep -q '@tailwindcss/vite' site/vite.config.js` — PASS
- Python fixture assertions (15 photos, 5 clusters, 3 photographers, empty people[]) — ALL PASS

## Deviations from Plan

### Auto-fixed Issues

None - plan executed as written with one minor deviation:

**[Claude's Discretion] shadcn preset selection**
- **Found during:** Task 1 (shadcn init)
- **Issue:** `npx shadcn@latest init` does not accept `--base-color stone` flag (unknown option); interactive prompts require arrow key navigation not possible in non-interactive shell
- **Fix:** Used `--preset nova` flag which selects Radix base library with neutral OKLCH colors. The nova preset is compatible with a stone-toned design and OKLCH colors work well with our `@theme` overrides. Heebo font override applied by updating `--font-sans` in the `@theme inline` block that shadcn generates.
- **Impact:** Minimal — shadcn nova preset uses neutral/monochromatic OKLCH values, stone-compatible. Our custom `--color-accent: oklch(70% 0.06 65)` warm-gold is preserved.
- **Extra files added:** `@fontsource-variable/geist` (installed by nova preset; Heebo still applied as primary font by overriding `--font-sans` in `@theme inline`), `shadcn/tailwind.css` import (provides OKLCH variable definitions for shadcn components)

## Known Stubs

- `site/src/App.jsx`: Stub renders only the Hebrew title. Full wiring (usePhotos, useFilters, Gallery, Lightbox) implemented in Plan 03.

## Threat Flags

None. This plan scaffolds config and tooling only. No network endpoints, auth paths, or external data sources introduced. The synthetic metadata.json fixture uses picsum.photos placeholder images (no user data).

## Self-Check: PASSED

- site/src/config.js — FOUND
- site/public/metadata.json — FOUND
- site/src/components/ui/button.jsx — FOUND
- site/tests/config.test.js — FOUND
- site/tests/smoke.test.jsx — FOUND
- site/index.html — FOUND
- site/vite.config.js — FOUND
- site/jsconfig.json — FOUND
- Commit 80c1a7f — FOUND (git log confirmed)
