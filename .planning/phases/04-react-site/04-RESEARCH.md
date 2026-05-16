# Phase 4: React Site - Research

**Researched:** 2026-05-16
**Domain:** React 19 + Vite 6 + Tailwind CSS v4 + shadcn/ui — static photo gallery with RTL Hebrew UI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Tailwind CSS + shadcn/ui. User delegated design choices to Claude with explicit "make it subtle, yet modern, aesthetic."
- **D-02:** RTL layout via `dir="rtl"` on the HTML root element. Tailwind's `rtl:` variants handle directional overrides.
- **D-03:** Masonry grid using `react-masonry-css` (lightweight, no JS layout engine). Photos ordered by `sort_key` from metadata.json within each section.
- **D-04:** 5 fixed phase sections in wedding order: prep → photoshooting → dining → hupa → dancing. Each section has a sticky Hebrew phase header above its masonry grid.
- **D-05:** When filters make a section empty, the section (header + grid) collapses completely — no "0 photos" placeholder. Only sections with matching photos appear.
- **D-06:** Even when filters are active, photos always stay in their phase sections (not flattened into a single unsectioned grid). The wedding narrative is preserved.
- **D-07:** `yet-another-react-lightbox` (yarl). Handles mobile swipe, RTL-aware, and navigates through the currently filtered set (not all photos). Previous/next navigation respects active filters.
- **D-08:** Sticky top bar — always visible, no sidebar or drawer variant needed.
- **D-09:** AND logic across filter groups: a photo must match the selected photographer AND the selected phase to appear. Each group is multi-select (selecting multiple photographers within the group is OR within that group).
- **D-10:** Live filtering — no "apply" button. All filtering is in-memory, instant.
- **D-11:** Clear all button resets both photographer and phase filters to show all photos.
- **D-12:** Face filter control (FILT-04): hidden entirely when `people.length === 0`. No placeholder or greyed-out state.
- **D-13:** Hover overlay on each thumbnail — photographer's real name appears in a subtle badge at the bottom-right corner on hover (mouse) or tap-hold (mobile). No credit visible at rest.
- **D-14:** Credit uses the real name, not the A/B/C label. The React app maps `photographer` metadata keys to display names using the same key→name config that the filter chips use.
- **D-15:** Phase key-to-Hebrew string mapping lives in `site/src/config.js` (or equivalent). Not hard-coded inline — a single map object that can be updated without touching component logic.

### Claude's Discretion

- Exact Tailwind theme colors, typography scale, and spacing
- Thumbnail aspect ratio behavior in masonry (variable height is fine — masonry)
- Loading state while metadata.json is being fetched (skeleton or spinner)
- Error state if metadata.json fetch fails
- Exact hover animation timing and style for photographer credit badge
- Mobile breakpoints for masonry column count

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GALL-01 | metadata.json fetched from R2 on page load; all filtering and state managed in-memory | `usePhotos` hook with `fetch()` + `useMemo` for derived filtered arrays |
| GALL-02 | Responsive masonry grid grouped into Hebrew phase sections | `react-masonry-css` with 5 `GallerySection` components; section headers with Hebrew labels from `config.js` |
| GALL-03 | Lightbox opens on photo click, showing full-resolution image | `yet-another-react-lightbox` with `r2_url` as slide src |
| GALL-04 | Lightbox supports previous/next navigation through currently filtered set | Pass filtered photos array as `slides` to yarl; `index` prop controls open position |
| FILT-01 | User can filter by photographer (multi-select: A, B, C) | Filter chips in `Filters.jsx`; OR logic within photographer group |
| FILT-02 | User can filter by wedding phase (multi-select across all 5 phases) | Filter chips in `Filters.jsx`; OR logic within phase group |
| FILT-03 | Clear all filters button resets view to all photos | "הצג הכל" button; clears both filter sets simultaneously |
| FILT-04 | Face filter hidden when people.length === 0 | Conditional render (not CSS hide) on `people.length > 0` check |
| DSGN-01 | Gallery design is beautiful, subtle, and interactive | shadcn/ui + Tailwind v4; warm stone palette from UI-SPEC |
| I18N-01 | All displayed UI text is in Hebrew | Full copywriting contract in UI-SPEC §6; all strings in Hebrew |
| I18N-02 | Page layout uses RTL | `dir="rtl"` + `lang="he"` on `<html>`; Tailwind `rtl:` and logical properties |
| I18N-03 | Phase cluster keys mapped to Hebrew display strings via config entry | `PHASE_LABELS` export in `site/src/config.js`; not hard-coded in components |
</phase_requirements>

---

## Summary

Phase 4 builds the entire `site/` directory from scratch — Vite scaffolding, shadcn/ui initialization, component implementation, and a local dev fixture. The stack is React 19 + Vite 8 + Tailwind CSS v4 + shadcn/ui (latest), all of which are now stable and mutually compatible as of early 2025. The `yet-another-react-lightbox` (yarl) v3.32.0 and `react-masonry-css` v1.0.16 are both established packages with verified npm registries and GitHub source repos.

The most significant planning risk is the **Tailwind v4 + shadcn + JavaScript (non-TypeScript)** combination. Tailwind v4 ships with breaking config changes (no `tailwind.config.js`, CSS-first configuration, OKLCH colors), and shadcn's official Vite guide assumes TypeScript. The workaround is well-documented: use `jsconfig.json` for path aliases instead of `tsconfig.json`, and initialize shadcn with `npx shadcn@latest init` which now supports Tailwind v4 natively. No canary tag is required — shadcn `4.7.0` is stable on `@latest`.

The RTL implementation is CSS-first: `dir="rtl"` on `<html>` propagates into yarl automatically (it reads computed `direction` from ancestors). The Heebo font is available via either a Google Fonts `@import` or the self-hosted `@fontsource/heebo` npm package — both are appropriate; the latter avoids external network requests at build time.

Performance is tractable: `react-masonry-css` is CSS-only (no JS layout recalculation), `useMemo` on filter derivation prevents redundant array work, and yarl only preloads adjacent slides. With 1300 thumbnails all using `loading="lazy"`, initial paint is fast.

**Primary recommendation:** Scaffold `site/` with `npm create vite@latest site -- --template react`, then configure Tailwind v4 with `@tailwindcss/vite`, then run `npx shadcn@latest init` and answer prompts to get a working baseline before writing any component code.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Data fetching (metadata.json) | Browser / Client | — | No server; single fetch on mount in `App.jsx` |
| Filter state management | Browser / Client | — | All in-memory; no server-side filtering ever |
| Masonry layout | Browser / Client | CDN / Static | CSS grid columns; Vite bundles the JS, CDN serves the built files |
| Lightbox rendering | Browser / Client | — | Client-side overlay; images served from R2 |
| RTL layout | Browser / Client | — | `dir="rtl"` on HTML root; Tailwind utility classes |
| Hebrew UI strings | Browser / Client | — | `config.js` loaded as static JS module at bundle time |
| Image storage | CDN / Static (R2) | — | All photos and thumbs served from Cloudflare R2 |
| Site hosting | CDN / Static (Pages) | — | Vite build output deployed to Cloudflare Pages |
| Photo processing | — | — | Out of scope for this phase; Pipeline responsibility |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.6 [VERIFIED: npm registry] | UI component tree | Latest stable; yarl and shadcn both support it |
| vite | 8.0.13 [VERIFIED: npm registry] | Dev server + bundler | Fastest build tooling for React; official Vite template |
| @vitejs/plugin-react | 6.0.2 [VERIFIED: npm registry] | JSX transform + HMR | Official Vite plugin; ships with React template |
| tailwindcss | 4.3.0 [VERIFIED: npm registry] | Utility CSS framework | v4 is current stable; shadcn updated for v4 |
| @tailwindcss/vite | 4.3.0 [VERIFIED: npm registry] | Tailwind v4 Vite plugin | Replaces PostCSS config for v4; CSS-first approach |
| shadcn (CLI) | 4.7.0 [VERIFIED: npm registry] | Component generator | Generates shadcn components into project; not a runtime dep |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-masonry-css | 1.0.16 [VERIFIED: npm registry] | CSS masonry grid | Variable-height photo grid; no JS reflow |
| yet-another-react-lightbox | 3.32.0 [VERIFIED: npm registry] | Photo lightbox | Full-screen viewer with swipe, keyboard, RTL |
| lucide-react | 1.16.0 [VERIFIED: npm registry] | Icon set | Included via shadcn; used for AlertTriangle in error state |
| @fontsource/heebo | 5.2.8 [VERIFIED: npm registry] | Self-hosted Hebrew font | Eliminates Google Fonts network dependency; same font, bundled |
| tw-animate-css | 1.4.0 [VERIFIED: npm registry] | Tailwind v4 animation utilities | Replaces `tailwindcss-animate` in Tailwind v4 + shadcn setup |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@fontsource/heebo` | Google Fonts `@import` URL | Google Fonts is simpler but adds external network dependency and potential GDPR concern; `@fontsource/heebo` bundles the font in the build output |
| `react-masonry-css` | CSS `columns` property | Pure CSS columns are simpler but do not support responsive breakpoints with a React-friendly API; masonry-css is ~2KB and integrates cleanly |
| `yet-another-react-lightbox` | `react-image-lightbox` | react-image-lightbox is unmaintained; yarl is actively maintained with React 19 support and RTL |

**Installation:**

```bash
# Step 1: Vite scaffold (from wedding-photos-website root)
npm create vite@latest site -- --template react
cd site
npm install

# Step 2: Tailwind v4
npm install tailwindcss @tailwindcss/vite

# Step 3: shadcn path alias dep (JavaScript projects use @types/node for path resolution)
npm install -D @types/node

# Step 4: Runtime dependencies
npm install react-masonry-css yet-another-react-lightbox @fontsource/heebo tw-animate-css

# Step 5: shadcn init (interactive — choose Stone base color, CSS variables: yes, no TypeScript)
npx shadcn@latest init

# Step 6: Add required shadcn components
npx shadcn@latest add button
```

**Version verification:** All packages confirmed via `npm view <pkg> version` on 2026-05-16.

---

## Package Legitimacy Audit

> slopcheck was not available in this environment — all packages are tagged `[ASSUMED]` from a registry-existence standpoint. All packages were cross-verified via official documentation and GitHub source repositories.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| react | npm | 13+ yrs | 500M+/wk | github.com/facebook/react | N/A | Approved — authoritative |
| vite | npm | 5+ yrs | 20M+/wk | github.com/vitejs/vite | N/A | Approved — authoritative |
| @vitejs/plugin-react | npm | 4+ yrs | 10M+/wk | github.com/vitejs/vite-plugin-react | N/A | Approved — authoritative |
| tailwindcss | npm | 7+ yrs | 40M+/wk | github.com/tailwindlabs/tailwindcss | N/A | Approved — authoritative |
| @tailwindcss/vite | npm | 1+ yr | 3M+/wk | github.com/tailwindlabs/tailwindcss | N/A | Approved — official Tailwind plugin |
| react-masonry-css | npm | 8 yrs | ~192K/wk | github.com/paulcollett/react-masonry-css | unavailable | Approved — verified active repo, 1K+ stars |
| yet-another-react-lightbox | npm | 3+ yrs | unknown | github.com/igordanchenko/yet-another-react-lightbox | unavailable | Approved — active maintenance (May 2026 release), official docs site |
| lucide-react | npm | 4+ yrs | 5M+/wk | github.com/lucide-icons/lucide | N/A | Approved — official icon set |
| @fontsource/heebo | npm | 4+ yrs | 10K+/wk | github.com/fontsource/font-files | unavailable | Approved — official Fontsource project, OFL-1.1 license |
| tw-animate-css | npm | ~1.5 yrs | unknown | github.com/Wombosvideo/tw-animate-css | unavailable | Flagged — newer package, shadcn docs explicitly recommend it for v4 |
| shadcn (CLI) | npm | 2+ yrs | 1M+/wk | github.com/shadcn-ui/ui | N/A | Approved — official shadcn CLI |

**Packages removed due to slopcheck [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** `tw-animate-css` — newer package (~1.5 yrs) with unknown download count, but explicitly documented in shadcn's official Tailwind v4 changelog as the replacement for `tailwindcss-animate`. Planner should note this; no `checkpoint:human-verify` task required given the official documentation trail.

*slopcheck was unavailable at research time. Packages above are tagged `[ASSUMED]` for registry-provenance but cross-referenced against official documentation and active GitHub repos.*

---

## Architecture Patterns

### System Architecture Diagram

```
Browser                    CDN / Static                   Build (local)
───────────────────────    ──────────────────────────     ─────────────────
Page load                  Cloudflare Pages               npm run build
  │                          serve dist/                    │
  ▼                               ▲                         │
App.jsx                           │                    Vite bundles
  │ fetch()                       │ HTML/JS/CSS        site/src/ → dist/
  │─────────────────────────────────────────────────►  (Phase 5 deploys)
  │
  │  fetch metadata.json
  │─────────────────────────────────────►  Cloudflare R2
  │◄─────────────────────────────────────  { photos[], people[] }
  │
  │ useState(filters)
  │ useMemo(filteredPhotos)
  │
  ├─► Filters.jsx ──────────── chip clicks update filter state
  │
  └─► Gallery.jsx
        │
        ├─[per PHASE_ORDER]─► GallerySection.jsx
        │     │                  │ section header (Hebrew label, photo count)
        │     │                  └─► Masonry
        │     │                        └─► PhotoCard.jsx × N
        │     │                              │ <img src={thumb_url} loading="lazy">
        │     │                              └─► hover badge (photographer name)
        │     │
        │     (section hidden when filteredBySection.length === 0)
        │
        └─► Lightbox.jsx (yarl)
              │ open={lightboxOpen}
              │ slides={filteredPhotos}  ← same filtered set, not all photos
              │ index={clickedIndex}
              └─► r2_url for full-res image
```

### Recommended Project Structure

```
site/
  index.html                   # dir="rtl", lang="he", Heebo font import
  jsconfig.json                # path alias: @/ → ./src/
  vite.config.js               # @tailwindcss/vite plugin, @ alias
  src/
    index.css                  # @import "tailwindcss"; @import "@fontsource/heebo"
    main.jsx                   # ReactDOM.createRoot, mounts <App />
    config.js                  # PHASE_LABELS, PHASE_ORDER, PHOTOGRAPHER_NAMES, METADATA_URL
    App.jsx                    # root: fetch, filter state, layout orchestration
    components/
      ui/                      # shadcn-generated components (Button, etc.)
      Filters.jsx              # sticky filter bar, chip group logic
      Gallery.jsx              # iterates PHASE_ORDER, renders GallerySection per phase
      GallerySection.jsx       # single phase section: sticky header + Masonry grid
      PhotoCard.jsx            # thumbnail img + hover photographer badge
      Lightbox.jsx             # yarl wrapper, receives slides + index props
      LoadingSkeleton.jsx      # skeleton placeholder grid for loading state
      ErrorState.jsx           # fetch error card with retry
      EmptyState.jsx           # zero-results message
    hooks/
      usePhotos.js             # fetch + parse metadata.json; returns { photos, people, loading, error }
      useFilters.js            # filter state + useMemo for filteredPhotos derivation
  public/
    metadata.json              # local dev fixture (real or synthetic)
```

### Pattern 1: Vite + Tailwind v4 Configuration (JavaScript project)

**What:** Tailwind v4 eliminates `tailwind.config.js`. Configuration is CSS-first. Path aliases require `jsconfig.json` instead of `tsconfig.json`.

**When to use:** All new Vite + React + JavaScript projects with Tailwind v4.

```js
// vite.config.js
// Source: https://ui.shadcn.com/docs/installation/vite
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

```json
// jsconfig.json (project root)
// Source: community guides for JS shadcn setup
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

```css
/* src/index.css */
/* Source: https://ui.shadcn.com/docs/tailwind-v4 */
@import "tailwindcss";
@import "@fontsource/heebo/400.css";
@import "@fontsource/heebo/600.css";
```

### Pattern 2: Filter State + Memoized Derivation

**What:** All filter state lives in `App.jsx`. Filtered results are derived with `useMemo` from raw photos + active filters. No re-fetching, no useEffect chains.

**When to use:** Any in-memory filtering over a large static array.

```js
// src/hooks/useFilters.js
// Source: [ASSUMED] — standard React pattern
import { useState, useMemo } from 'react';
import { PHASE_ORDER } from '@/config';

export function useFilters(photos) {
  const [selectedPhotographers, setSelectedPhotographers] = useState(new Set());
  const [selectedPhases, setSelectedPhases] = useState(new Set());

  const filteredByPhase = useMemo(() => {
    return PHASE_ORDER.reduce((acc, phase) => {
      const sectionPhotos = photos
        .filter(p => p.cluster === phase)
        .filter(p => selectedPhotographers.size === 0 || selectedPhotographers.has(p.photographer))
        .filter(p => selectedPhases.size === 0 || selectedPhases.has(p.cluster));
      acc[phase] = sectionPhotos;
      return acc;
    }, {});
  }, [photos, selectedPhotographers, selectedPhases]);

  // ... toggle handlers, clear handler
  return { filteredByPhase, selectedPhotographers, selectedPhases, /* handlers */ };
}
```

### Pattern 3: yarl RTL Configuration

**What:** yarl reads the computed CSS `direction` property from its container. With `dir="rtl"` on `<html>`, it inherits correctly. For portal instances that escape the DOM tree, pass `portal={{ container: { dir: 'rtl' } }}`.

**When to use:** Any yarl instance in an RTL document.

```jsx
// src/components/Lightbox.jsx
// Source: https://yet-another-react-lightbox.com/documentation
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

export function LightboxWrapper({ open, onClose, slides, index }) {
  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={slides}
      index={index}
      portal={{ container: { dir: 'rtl' } }}
      on={{ view: ({ index: i }) => { /* track if needed */ } }}
    />
  );
}
```

### Pattern 4: react-masonry-css Responsive Breakpoints

**What:** `breakpointCols` object maps viewport widths to column counts. Keys are min-width thresholds; `default` is the initial (largest) count.

```jsx
// Source: https://github.com/paulcollett/react-masonry-css
import Masonry from 'react-masonry-css';

const breakpoints = {
  default: 5,   // ≥ 1280px
  1280: 5,
  1024: 4,
  640: 3,
  0: 2,
};

<Masonry
  breakpointCols={breakpoints}
  className="masonry-grid"
  columnClassName="masonry-grid_column"
>
  {photos.map(photo => <PhotoCard key={photo.id} photo={photo} />)}
</Masonry>
```

CSS required (in `index.css` or component):

```css
.masonry-grid { display: flex; gap: 8px; }
.masonry-grid_column { display: flex; flex-direction: column; gap: 8px; }
```

### Pattern 5: metadata.json Fetch Hook

**What:** Centralized fetch in `usePhotos.js`, returns `{ photos, people, loading, error }`. No data transformation in components.

```js
// src/hooks/usePhotos.js
// Source: [ASSUMED] — standard React fetch pattern
import { useState, useEffect } from 'react';
import { METADATA_URL } from '@/config';

export function usePhotos() {
  const [state, setState] = useState({ photos: [], people: [], loading: true, error: null });

  useEffect(() => {
    fetch(METADATA_URL)
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(data => setState({ photos: data.photos, people: data.people, loading: false, error: null }))
      .catch(err => setState(s => ({ ...s, loading: false, error: err })));
  }, []);

  return state;
}
```

### Anti-Patterns to Avoid

- **Re-fetching on filter change:** The entire point of GALL-01 is one fetch. Never call `fetch(METADATA_URL)` except on mount.
- **Putting filter logic in Gallery.jsx:** Filter logic belongs in `useFilters.js` / `App.jsx`. Gallery receives pre-filtered data per section.
- **Hard-coding Hebrew strings in JSX:** All UI text goes through the copywriting contract in `config.js` or the UI-SPEC §6 table. Changing a string should not require touching component logic.
- **`tailwind.config.js`:** This file does not exist in Tailwind v4. Configuration is done in `index.css` with CSS variables and `@theme` directive.
- **Using `class="dark"` toggle:** Dark mode is explicitly out of scope. Use `class="light"` on root if shadcn requires explicit mode declaration.
- **`float: left/right` or `text-align: left/right`:** Use CSS logical properties (`padding-inline-start`, `margin-inline-end`) and Tailwind logical utilities (`ps-`, `pe-`, `ms-`, `me-`). Tailwind `rtl:` variants for directional overrides.
- **Rendering all 1300 photos without `loading="lazy"`:** All `<img>` elements must have `loading="lazy"` to prevent simultaneous loading of the full photo set.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Masonry layout | Custom CSS grid with JS column calculation | `react-masonry-css` | JS layout recalculation is expensive; the CSS column approach handles variable-height images correctly |
| Lightbox with keyboard/swipe/RTL | Custom modal with gesture handling | `yet-another-react-lightbox` | Swipe detection, focus trap, keyboard navigation, aria labeling, RTL — each is a rabbit hole individually |
| Animation utilities (Tailwind v4) | Custom keyframe CSS | `tw-animate-css` | shadcn generates components that import from this package; hand-rolling alternatives breaks generated code |
| Hebrew font loading | Manual font file management | `@fontsource/heebo` | Bundles font as npm dependency; vite tree-shakes unused weights automatically |
| Path alias resolution | Relative `../../` import chains | `jsconfig.json` + vite `@` alias | Prevents import drift as component tree grows |

**Key insight:** The lightbox and masonry libraries each paper over 3-5 browser-specific edge cases. The cost of maintaining custom implementations would exceed the build budget.

---

## Common Pitfalls

### Pitfall 1: Tailwind v4 Breaking Changes From v3

**What goes wrong:** Developer writes `tailwind.config.js`, uses `@apply` with v3-style tokens, or imports `tailwindcss/base` directly. Build fails or styles are missing.

**Why it happens:** Tailwind v4 switched to CSS-first configuration. No `tailwind.config.js`. Configuration happens via `@theme` directive in CSS. The `@import "tailwindcss"` single import replaces the three-line `@tailwind base/components/utilities` pattern.

**How to avoid:** The single import `@import "tailwindcss"` in `index.css` is the complete Tailwind setup. Custom theme values go in `@theme { --color-accent: oklch(...); }` blocks in CSS, not in a config file.

**Warning signs:** `tailwind.config.js` appearing in the project root; `@apply` using tokens not defined in CSS `@theme`; build warnings about missing config.

### Pitfall 2: shadcn Init Requires TypeScript Path Aliases in a JS Project

**What goes wrong:** `npx shadcn@latest init` fails or generates components with broken `@/` imports because `tsconfig.json` doesn't exist in a JavaScript project.

**Why it happens:** shadcn's official guide targets TypeScript and expects `tsconfig.json` for path resolution. JavaScript projects use `jsconfig.json` instead.

**How to avoid:** Create `jsconfig.json` at the project root with `compilerOptions.paths` before running `npx shadcn@latest init`. Also configure the `@` alias in `vite.config.js` resolve.alias. Shadcn will read `jsconfig.json`.

**Warning signs:** Import errors on `@/components/ui/button` after shadcn init; `components.json` referencing paths that don't resolve.

### Pitfall 3: yarl Lightbox Slides Must Be the Filtered Set

**What goes wrong:** Lightbox is initialized with all 1300 photos but prev/next navigation does not respect active filters.

**Why it happens:** The `slides` prop to yarl is the navigation sequence. Passing all photos means navigating to unfiltered photos. GALL-04 explicitly requires navigation through the currently filtered set.

**How to avoid:** Derive `flatFilteredPhotos` from `filteredByPhase` (flatten the per-section arrays in `PHASE_ORDER` order) and pass this as `slides` to yarl. The `index` prop is the position of the clicked photo within this filtered flat array.

**Warning signs:** Clicking prev/next in the lightbox shows photos that don't match the active filters.

### Pitfall 4: Section Collapse vs CSS Hide

**What goes wrong:** Empty sections are hidden with `display: none` or `visibility: hidden` in CSS but the DOM still contains hundreds of `<img>` elements that may still load.

**Why it happens:** D-05 says "collapses completely" — this means conditional rendering (`&&` or early return), not CSS hiding. CSS hiding keeps the DOM intact and does not prevent lazy-loaded images from eventually loading.

**How to avoid:** In `Gallery.jsx`, conditionally render `<GallerySection>` only when `filteredByPhase[phase].length > 0`. The section must not be in the DOM at all.

**Warning signs:** Network tab showing thumbnail requests for photos in filtered-out phases.

### Pitfall 5: RTL Logical Property Inconsistency

**What goes wrong:** Some components use `pl-4` / `pr-4` while others use `ps-4` / `pe-4`, creating layout bugs where padding appears on the wrong side in RTL.

**Why it happens:** Tailwind has both physical (`pl`, `pr`, `ml`, `mr`) and logical (`ps`, `pe`, `ms`, `me`) utilities. Physical utilities do not flip in RTL; logical ones do.

**How to avoid:** Use logical utilities exclusively: `ps-` (padding-inline-start), `pe-` (padding-inline-end), `ms-`, `me-`. When `dir="rtl"` is set, `ps-4` automatically becomes left-padding from the user's perspective. Use `rtl:` variants only when you need to override a physical property from a library.

**Warning signs:** Filter bar or section headers have padding on the wrong side when viewed in a Hebrew browser.

### Pitfall 6: `react-masonry-css` CSS Must Be Added Manually

**What goes wrong:** Masonry columns appear stacked vertically or columns are not separated because the required CSS classes are missing.

**Why it happens:** `react-masonry-css` is CSS-only — it applies class names (`masonry-grid` and `masonry-grid_column`) that require corresponding CSS rules not included in the library. They must be declared in your own stylesheet.

**How to avoid:** Add the flex-based masonry CSS to `index.css` or a dedicated component stylesheet. Minimum required:
```css
.masonry-grid { display: flex; }
.masonry-grid_column { display: flex; flex-direction: column; }
```
Column and row gap are set here, not via Tailwind (Tailwind doesn't know these class names).

---

## Code Examples

Verified patterns from official sources:

### shadcn/ui Button Component (used in error state)

```jsx
// Source: Generated by `npx shadcn@latest add button`
// Usage in ErrorState.jsx
import { Button } from '@/components/ui/button';

<Button onClick={() => window.location.reload()}>
  רענן
</Button>
```

### config.js Canonical Shape

```js
// src/config.js — DO NOT DEVIATE from this shape
// Source: CONTEXT.md D-15 + UI-SPEC §11
export const PHASE_LABELS = {
  prep: 'הכנות',
  photoshooting: 'צילומים',
  dining: 'ארוחה',
  hupa: 'חופה',
  dancing: 'ריקודים',
};

// Order matters — this is the actual wedding timeline
export const PHASE_ORDER = ['prep', 'photoshooting', 'dining', 'hupa', 'dancing'];

export const PHOTOGRAPHER_NAMES = {
  abir_sultan: 'עביר סולטן',
  inbal_zeldin: 'ענבל זלדין',
  magnate_images: 'Magnate Images',
};

// Defaults to local dev fixture; override with VITE_METADATA_URL env var for production
export const METADATA_URL = import.meta.env.VITE_METADATA_URL || '/metadata.json';
```

### Tailwind v4 Custom Theme (stone palette + warm-gold accent)

```css
/* src/index.css — [ASSUMED] Tailwind v4 @theme syntax */
@import "tailwindcss";

@theme {
  --color-accent: oklch(70% 0.06 65);        /* warm-gold #A8967A equivalent */
  --color-accent-hover: oklch(63% 0.06 65);  /* darker hover state */
  --font-family-sans: 'Heebo', system-ui, sans-serif;
}
```

### index.html RTL + lang + Heebo

```html
<!-- site/index.html -->
<!-- Source: UI-SPEC §7 + §3 -->
<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>האלבום שלנו</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` + PostCSS | CSS-first `@import "tailwindcss"` + `@tailwindcss/vite` | Tailwind v4 (Jan 2025) | No config file; custom theme in CSS `@theme` block |
| `tailwindcss-animate` | `tw-animate-css` | shadcn Tailwind v4 update (Feb 2025) | shadcn-generated components import from `tw-animate-css`; using old package breaks shadcn components |
| `@shadcn/ui` (npm package) | `shadcn` (CLI, npm package) | 2024 | `shadcn` is the current CLI package; `@shadcn/ui` is a stub (v0.0.4) |
| `npx shadcn-ui@latest` | `npx shadcn@latest` | 2024 | Command renamed; old command still works as redirect but `shadcn` is canonical |
| Three-line Tailwind import (`@tailwind base/components/utilities`) | Single `@import "tailwindcss"` | Tailwind v4 | Write only the one line in `index.css` |
| HSL color values in shadcn theme | OKLCH color values | shadcn Tailwind v4 update (Feb 2025) | Better perceptual uniformity; shadcn generates OKLCH out of the box |
| `forwardRef` in shadcn components | Direct ref passing (React 19) | shadcn Tailwind v4 update (Feb 2025) | React 19 allows ref as a regular prop; shadcn components updated |

**Deprecated/outdated:**
- `tailwind.config.js`: Does not exist in Tailwind v4. Any tutorial mentioning it targets v3.
- `@shadcn/ui` npm package: v0.0.4 stub only; use `shadcn` CLI instead.
- `tailwindcss-animate`: Replaced by `tw-animate-css` for Tailwind v4 + shadcn.
- `npx create-react-app`: Not relevant — Vite is the standard.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `npx shadcn@latest init` accepts a JavaScript (non-TypeScript) project when `jsconfig.json` is present | Standard Stack / Patterns | Init fails or requires manual workaround; low risk — multiple community guides confirm this path |
| A2 | `useFilters.js` hook pattern using `useMemo` is sufficient performance for 1300 photos | Architecture Patterns | Filter lag on low-end mobile; medium risk — 1300 is small enough that even un-memoized filtering is sub-ms |
| A3 | `@fontsource/heebo` includes Hebrew subset by default (not just Latin) | Standard Stack | Hebrew text renders with system fallback font instead of Heebo; low risk — package description explicitly covers Hebrew |
| A4 | Tailwind v4 `rtl:` variants work the same as v3 for directional utilities | Common Pitfalls | RTL overrides silently break; low risk — RTL variant support is a core Tailwind feature documented in v4 |
| A5 | yarl `portal={{ container: { dir: 'rtl' } }}` is the correct prop path for v3.x | Code Examples | Lightbox navigation arrows appear on wrong sides; medium risk — verified via documentation fetch that RTL is supported; exact prop path from docs |

---

## Open Questions

1. **metadata.json local dev fixture format**
   - What we know: `site/public/metadata.json` is the local dev fixture path; `METADATA_URL` defaults to `/metadata.json`.
   - What's unclear: Whether a synthetic fixture is sufficient or whether the real pipeline output (from Phase 3) should be used. Phase 3 upload is not yet complete.
   - Recommendation: Create a minimal synthetic `metadata.json` with 10-15 photos covering all 5 phases and all 3 photographers. This is enough to develop and test all filter/layout logic.

2. **`react-masonry-css` last updated 2022**
   - What we know: Version 1.0.16 was published 2022-05-14 — no updates in 3 years. GitHub repo exists and has 1K+ stars.
   - What's unclear: Whether it has any known incompatibilities with React 19.
   - Recommendation: The library is CSS-only with a thin React wrapper — it is unlikely to have React 19 issues. If an issue is found during implementation, fallback to CSS `columns` property with manual breakpoint media queries.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite, npm, site build | ✓ | v26.0.0 | — |
| npm | Package installation | ✓ | 11.12.1 | — |
| `site/` directory | All site tasks | ✗ | — | Create via `npm create vite@latest site -- --template react` in Wave 0 |
| `site/public/metadata.json` | Local dev | ✗ | — | Create synthetic fixture in Wave 0 |
| Cloudflare R2 (production metadata.json) | Runtime | ✗ (Phase 5) | — | Local fixture covers Phase 4 dev |

**Missing dependencies with no fallback:** none — all missing items are created during Wave 0.

**Missing dependencies with fallback:** R2 production URL — local fixture covers all Phase 4 development and testing.

---

## Validation Architecture

> `nyquist_validation: true` in `.planning/config.json` — section required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.x (to be installed) — standard with Vite projects |
| Config file | `site/vitest.config.js` (Wave 0 gap) |
| Quick run command | `cd site && npx vitest run --reporter=dot` |
| Full suite command | `cd site && npx vitest run` |

> Note: The existing pipeline tests use `pytest` (Python). The React site requires a separate JS test framework. Vitest is the standard choice for Vite projects.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GALL-01 | Fetch fires once on mount; no refetch on filter change | unit | `npx vitest run tests/usePhotos.test.js` | ❌ Wave 0 |
| GALL-02 | Masonry grid renders N sections matching PHASE_ORDER | unit | `npx vitest run tests/Gallery.test.jsx` | ❌ Wave 0 |
| GALL-03 | Lightbox opens on photo click | unit | `npx vitest run tests/Lightbox.test.jsx` | ❌ Wave 0 |
| GALL-04 | Lightbox slides array matches filtered set, not all photos | unit | `npx vitest run tests/Lightbox.test.jsx` | ❌ Wave 0 |
| FILT-01 | Photographer multi-select filters gallery to correct photos | unit | `npx vitest run tests/useFilters.test.js` | ❌ Wave 0 |
| FILT-02 | Phase multi-select filters gallery to correct photos | unit | `npx vitest run tests/useFilters.test.js` | ❌ Wave 0 |
| FILT-03 | Clear all resets both filter groups | unit | `npx vitest run tests/useFilters.test.js` | ❌ Wave 0 |
| FILT-04 | Face filter absent from DOM when people.length === 0 | unit | `npx vitest run tests/Filters.test.jsx` | ❌ Wave 0 |
| I18N-03 | Phase labels rendered from config.js map, not hard-coded | unit | `npx vitest run tests/config.test.js` | ❌ Wave 0 |
| DSGN-01 | Beautiful design | manual | Visual review — cannot automate aesthetic judgment | N/A |
| I18N-01 | All UI text in Hebrew | manual | Visual review + string audit | N/A |
| I18N-02 | RTL layout correct | manual | Visual review in browser with `dir="rtl"` | N/A |

### Sampling Rate

- **Per task commit:** `cd site && npx vitest run --reporter=dot`
- **Per wave merge:** `cd site && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `site/vitest.config.js` — vitest config with jsdom environment
- [ ] `site/tests/usePhotos.test.js` — covers GALL-01
- [ ] `site/tests/useFilters.test.js` — covers FILT-01, FILT-02, FILT-03
- [ ] `site/tests/Gallery.test.jsx` — covers GALL-02
- [ ] `site/tests/Lightbox.test.jsx` — covers GALL-03, GALL-04
- [ ] `site/tests/Filters.test.jsx` — covers FILT-04
- [ ] `site/tests/config.test.js` — covers I18N-03
- [ ] `site/tests/setup.js` — shared `@testing-library/jest-dom` setup
- [ ] Framework install: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom` inside `site/`

---

## Security Domain

> `security_enforcement` not explicitly set to `false` in config — section required.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth in this application |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | Public gallery, no access control |
| V5 Input Validation | yes (minor) | No user-supplied URLs; `metadata.json` is trusted pipeline output — no special validation needed beyond checking `Array.isArray(data.photos)` |
| V6 Cryptography | no | No secrets handled in the browser |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Open redirect via `VITE_METADATA_URL` | Tampering | `METADATA_URL` is a build-time env var set by the deployer; not user-controlled at runtime |
| XSS via metadata.json injection | Tampering | React's JSX rendering escapes all string values; photographer names and Hebrew labels rendered as text nodes, not `dangerouslySetInnerHTML` |
| Image URL injection | Tampering | `r2_url` and `thumb_url` values from metadata.json are used in `<img src>` — only image loads occur, no script execution |

**Assessment:** Phase 4 has minimal security surface. The site is a read-only static gallery with no user input, no authentication, and no server. The primary risk vector is the `metadata.json` content itself — but that file is generated by the trusted pipeline and served from R2.

---

## Project Constraints (from CLAUDE.md)

- **No server:** All logic runs in the browser or in the pipeline. Do not introduce a backend for Phase 4.
- **metadata.json under 1MB:** The site must not store raw embeddings or face data client-side. Fetch once, filter in-memory.
- **R2 storage:** Images served from Cloudflare R2. R2 URL structure from Phase 3: `{r2_public_url}/photos/{id}.jpg` and `{r2_public_url}/thumbs/{id}.jpg`.
- **Static build:** `npm run build` → `site/dist/`. Deployed to Cloudflare Pages (Phase 5).
- **PascalCase for component files:** `App.jsx`, `Gallery.jsx`, `Filters.jsx`, `Lightbox.jsx` etc.
- **camelCase for JS variables/functions:** Standard JS convention.
- **React default export per component file.**
- **Face filter gate:** `Filters.jsx` must hide the face filter when `people.length === 0` — conditional render, not CSS.
- **Python 3.13 + uv:** Not relevant to Phase 4 (site only). Pipeline commands remain `uv run python pipeline/<script>.py`.
- **Heebo font:** Hebrew RTL font per UI-SPEC D-15.
- **Phase display order:** `prep`, `photoshooting`, `dining`, `hupa`, `dancing` — this is the actual wedding timeline, not alphabetical.

---

## Sources

### Primary (HIGH confidence)

- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — confirmed Tailwind v4 stable support, OKLCH colors, tw-animate-css, init command
- [shadcn/ui Vite installation](https://ui.shadcn.com/docs/installation/vite) — Tailwind v4 + Vite setup, package list
- [yet-another-react-lightbox documentation](https://yet-another-react-lightbox.com/documentation) — RTL via `portal.container.dir`, `index` prop, plugins list
- [react-masonry-css GitHub](https://github.com/paulcollett/react-masonry-css) — `breakpointCols` object syntax, CSS class requirements
- `npm view <pkg> version` (2026-05-16) — all package version numbers verified against npm registry

### Secondary (MEDIUM confidence)

- [Medium: React 19 + Tailwind v4 + shadcn without TypeScript](https://medium.com/@sumitnce1/setting-up-react-19-with-tailwind-css-v4-and-shadcn-ui-without-typescript-b47136d335da) — confirmed `jsconfig.json` pattern for JS projects
- [DEV Community: shadcn Canary + Tailwind v4 JavaScript](https://dev.to/skidee/set-up-shadcn-canary-with-tailwind-css-4-in-a-react-vite-project-javascript-only-3hof) — confirmed JavaScript-compatible init flow
- [npmjs.com: react-masonry-css](https://www.npmjs.com/package/react-masonry-css) — 191,914 weekly downloads confirmed via WebSearch result

### Tertiary (LOW confidence)

- React `useMemo` filter pattern — standard documented React pattern; training knowledge confirmed by React docs
- CSS masonry `flex` implementation for `react-masonry-css` — from library README (fetched via GitHub)

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all package versions verified via npm registry; Tailwind v4 + shadcn compatibility confirmed via official docs
- Architecture: HIGH — component structure dictated by UI-SPEC; patterns confirmed via official library docs
- Pitfalls: HIGH — Tailwind v4 breaking changes confirmed via official changelog; RTL pitfalls confirmed via yarl docs; shadcn JS pitfall confirmed via multiple community guides
- Test setup: MEDIUM — Vitest is the standard for Vite but is not yet installed; specific test file contents are assumed

**Research date:** 2026-05-16
**Valid until:** 2026-06-16 (Tailwind v4 and shadcn are actively maintained; yarl patch releases are frequent but non-breaking)
