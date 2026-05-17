# Phase 4: React Site - Pattern Map

**Mapped:** 2026-05-16
**Files analyzed:** 17 new files (site/ does not yet exist — greenfield build)
**Analogs found:** 0 / 17 (no React/JS files exist in this codebase)

---

## Codebase Analog Status

The `site/` directory does not exist. This phase is a **complete greenfield build**.
No React, JavaScript, or Vite files exist in the project to draw patterns from.

The only codebase patterns available are from the **Python pipeline** scripts, which
provide conventions for: module structure, config-file-driven design, single-
responsibility files, `if __name__ == "__main__"` entry points, and `print()`-based
logging. These are noted in the shared patterns section where applicable.

All React/JS/Vite patterns below are drawn from:
1. **RESEARCH.md verified examples** (sourced from official library documentation)
2. **CONTEXT.md decisions** (D-01 through D-15)
3. **04-UI-SPEC.md** (color palette, typography, spacing)
4. **pipeline/config.yaml** (photographer labels and display names — data contract)
5. **pipeline/output/metadata.json** (actual runtime schema — verified field names)

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `site/index.html` | config | — | none | no analog |
| `site/vite.config.js` | config | — | none | no analog |
| `site/jsconfig.json` | config | — | none | no analog |
| `site/src/index.css` | config | — | none | no analog |
| `site/src/main.jsx` | entry-point | — | `main.py` (structural only) | concept-match |
| `site/src/config.js` | config/utility | — | `pipeline/config.yaml` (structural only) | concept-match |
| `site/src/App.jsx` | root-component | request-response | none | no analog |
| `site/src/hooks/usePhotos.js` | hook | request-response | none | no analog |
| `site/src/hooks/useFilters.js` | hook | transform | none | no analog |
| `site/src/components/Filters.jsx` | component | event-driven | none | no analog |
| `site/src/components/Gallery.jsx` | component | transform | none | no analog |
| `site/src/components/GallerySection.jsx` | component | transform | none | no analog |
| `site/src/components/PhotoCard.jsx` | component | event-driven | none | no analog |
| `site/src/components/Lightbox.jsx` | component | event-driven | none | no analog |
| `site/src/components/LoadingSkeleton.jsx` | component | — | none | no analog |
| `site/src/components/ErrorState.jsx` | component | — | none | no analog |
| `site/src/components/EmptyState.jsx` | component | — | none | no analog |

---

## Pattern Assignments

### `site/index.html` (config)

**Source:** RESEARCH.md §Code Examples + UI-SPEC §3 + CONTEXT.md D-02

**Critical attributes:** `lang="he"` and `dir="rtl"` on the `<html>` element. These
two attributes propagate RTL into every child component and into `yet-another-react-lightbox`
automatically (yarl reads computed `direction` from ancestors).

```html
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

### `site/vite.config.js` (config)

**Source:** RESEARCH.md §Pattern 1 (from shadcn official Vite installation docs)

**Critical:** Use `@tailwindcss/vite` plugin, NOT PostCSS. Tailwind v4 is CSS-first.
The `@` alias must be set here AND in `jsconfig.json` — both are required.

```js
// site/vite.config.js
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

---

### `site/jsconfig.json` (config)

**Source:** RESEARCH.md §Pattern 1 — required for shadcn init to resolve `@/` imports
in a non-TypeScript project. Must exist before running `npx shadcn@latest init`.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

### `site/src/index.css` (config)

**Source:** RESEARCH.md §Pattern 1 + §Code Examples (Tailwind v4 @theme)
**Also:** UI-SPEC §3 (Heebo font) and §4 (stone palette + warm-gold accent)

**Critical:** Single `@import "tailwindcss"` replaces the three-line v3 pattern.
No `tailwind.config.js` exists in v4. Custom theme values go in `@theme {}` block.
`react-masonry-css` requires manual CSS declarations — these classes are not Tailwind.

```css
/* site/src/index.css */
@import "tailwindcss";
@import "@fontsource/heebo/400.css";
@import "@fontsource/heebo/600.css";
@import "tw-animate-css";

@theme {
  --color-accent: oklch(70% 0.06 65);        /* warm-gold, ~#A8967A */
  --color-accent-hover: oklch(63% 0.06 65);
  --font-family-sans: 'Heebo', system-ui, sans-serif;
}

/* Required by react-masonry-css — NOT Tailwind classes */
.masonry-grid {
  display: flex;
  gap: 8px;
}
.masonry-grid_column {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (min-width: 640px) {
  .masonry-grid { gap: 12px; }
  .masonry-grid_column { gap: 12px; }
}

@media (min-width: 1024px) {
  .masonry-grid { gap: 16px; }
  .masonry-grid_column { gap: 16px; }
}
```

---

### `site/src/main.jsx` (entry-point)

**Source:** Standard React 19 + Vite pattern. Structural analog: `main.py` (single
entry-point, minimal logic, delegates to root module).

**Critical:** `StrictMode` on. No logic here beyond mount.

```jsx
// site/src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/index.css';
import App from '@/App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

---

### `site/src/config.js` (config/utility)

**Source:** RESEARCH.md §Code Examples — "config.js Canonical Shape"
**Data source:** `pipeline/config.yaml` lines 38-47 (photographer labels + display names)
**Pipeline analog:** `pipeline/config.yaml` — same pattern: single config file drives
display-facing strings; no string should be hard-coded in component logic.

**Critical constraints:**
- `PHASE_ORDER` array order is `['prep', 'photoshooting', 'dining', 'hupa', 'dancing']`
  — this is the **actual wedding timeline** from `pipeline/config.yaml` events section.
  Do NOT reorder alphabetically or by any other heuristic.
- `PHOTOGRAPHER_NAMES` keys must match the `photographer` field values in `metadata.json`
  exactly. Verified from `pipeline/output/metadata.json`: keys are `abir_sultan`,
  `inbal_zeldin`, `magnate_images`.
- `METADATA_URL` defaults to `/metadata.json` for local dev fixture in `site/public/`.

```js
// site/src/config.js
// DO NOT deviate from this shape — CONTEXT.md D-15, I18N-03

export const PHASE_LABELS = {
  prep: 'הכנות',
  photoshooting: 'צילומים',
  dining: 'ארוחה',
  hupa: 'חופה',
  dancing: 'ריקודים',
};

// Order = actual wedding timeline. DO NOT reorder.
export const PHASE_ORDER = ['prep', 'photoshooting', 'dining', 'hupa', 'dancing'];

// Keys must match photographer field in metadata.json exactly.
// Source: pipeline/config.yaml lines 38-47
export const PHOTOGRAPHER_NAMES = {
  abir_sultan: 'עביר סולטן',
  inbal_zeldin: 'ענבל זלדין',
  magnate_images: 'Magnate Images',
};

// Override with VITE_METADATA_URL for production (R2 URL)
export const METADATA_URL = import.meta.env.VITE_METADATA_URL || '/metadata.json';
```

---

### `site/src/hooks/usePhotos.js` (hook, request-response)

**Source:** RESEARCH.md §Pattern 5 — verified standard React fetch pattern

**Critical constraints:**
- Fetch fires ONCE on mount only (empty `[]` dependency array).
- Never call `fetch(METADATA_URL)` on filter change — GALL-01.
- Validate `Array.isArray(data.photos)` before setting state — security/robustness.
- `people` array must be returned so `App.jsx` can gate the face filter (FILT-04).
- Actual metadata.json schema (verified from `pipeline/output/metadata.json`):
  `{ photos: [{ id, filename, r2_url, thumb_url, photographer, timestamp, cluster,
  cluster_confidence, faces, sort_key }], people: [] }`

```js
// site/src/hooks/usePhotos.js
import { useState, useEffect } from 'react';
import { METADATA_URL } from '@/config';

export function usePhotos() {
  const [state, setState] = useState({
    photos: [],
    people: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetch(METADATA_URL)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      })
      .then(data => {
        if (!Array.isArray(data.photos)) {
          throw new Error('metadata.json: photos field is not an array');
        }
        setState({
          photos: data.photos,
          people: Array.isArray(data.people) ? data.people : [],
          loading: false,
          error: null,
        });
      })
      .catch(err =>
        setState(s => ({ ...s, loading: false, error: err }))
      );
  }, []); // empty deps — fetch once on mount only

  return state;
}
```

---

### `site/src/hooks/useFilters.js` (hook, transform)

**Source:** RESEARCH.md §Pattern 2 — filter state + memoized derivation

**Critical constraints:**
- AND logic across groups: photo must match selected photographer AND selected phase
  (CONTEXT.md D-09).
- Within each group: OR logic (multi-select: photo matches if it's in the selected Set).
- Empty Set = "all selected" (no filter applied for that group).
- `filteredByPhase` is a map `{ [phase]: Photo[] }` — Gallery iterates `PHASE_ORDER`.
- `flatFilteredPhotos` is the ordered flat array passed as `slides` to yarl (GALL-04).
  Order: follow `PHASE_ORDER`, sorted by `sort_key` ascending within each section.
- `useMemo` dependency array: `[photos, selectedPhotographers, selectedPhases]`.

```js
// site/src/hooks/useFilters.js
import { useState, useMemo, useCallback } from 'react';
import { PHASE_ORDER } from '@/config';

export function useFilters(photos) {
  const [selectedPhotographers, setSelectedPhotographers] = useState(new Set());
  const [selectedPhases, setSelectedPhases] = useState(new Set());

  const filteredByPhase = useMemo(() => {
    return PHASE_ORDER.reduce((acc, phase) => {
      acc[phase] = photos
        .filter(p => p.cluster === phase)
        .filter(p =>
          selectedPhotographers.size === 0 ||
          selectedPhotographers.has(p.photographer)
        )
        .filter(p =>
          selectedPhases.size === 0 || selectedPhases.has(p.cluster)
        )
        .sort((a, b) => a.sort_key - b.sort_key);
      return acc;
    }, {});
  }, [photos, selectedPhotographers, selectedPhases]);

  // Flat ordered array for yarl slides (GALL-04)
  const flatFilteredPhotos = useMemo(
    () => PHASE_ORDER.flatMap(phase => filteredByPhase[phase] || []),
    [filteredByPhase]
  );

  const togglePhotographer = useCallback(label => {
    setSelectedPhotographers(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }, []);

  const togglePhase = useCallback(phase => {
    setSelectedPhases(prev => {
      const next = new Set(prev);
      next.has(phase) ? next.delete(phase) : next.add(phase);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelectedPhotographers(new Set());
    setSelectedPhases(new Set());
  }, []);

  return {
    filteredByPhase,
    flatFilteredPhotos,
    selectedPhotographers,
    selectedPhases,
    togglePhotographer,
    togglePhase,
    clearAll,
  };
}
```

---

### `site/src/App.jsx` (root-component, request-response)

**Source:** RESEARCH.md §Architecture Patterns — system diagram + component tree

**Critical constraints:**
- Owns all filter state (via `useFilters`) and all fetch state (via `usePhotos`).
- Conditionally renders `LoadingSkeleton`, `ErrorState`, or the main layout.
- Passes `people` to `Filters.jsx` for face filter gate (FILT-04).
- Passes `flatFilteredPhotos` and lightbox open/index state down to `Gallery.jsx`
  and `Lightbox.jsx`.
- No filter logic inside this component — delegates to `useFilters`.
- No default export inconsistency — React components use `export default`.

```jsx
// site/src/App.jsx
import { useState } from 'react';
import { usePhotos } from '@/hooks/usePhotos';
import { useFilters } from '@/hooks/useFilters';
import Filters from '@/components/Filters';
import Gallery from '@/components/Gallery';
import LightboxWrapper from '@/components/Lightbox';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ErrorState from '@/components/ErrorState';

export default function App() {
  const { photos, people, loading, error } = usePhotos();
  const {
    filteredByPhase,
    flatFilteredPhotos,
    selectedPhotographers,
    selectedPhases,
    togglePhotographer,
    togglePhase,
    clearAll,
  } = useFilters(photos);

  const [lightboxIndex, setLightboxIndex] = useState(-1);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="min-h-screen bg-stone-50">
      <Filters
        people={people}
        selectedPhotographers={selectedPhotographers}
        selectedPhases={selectedPhases}
        onTogglePhotographer={togglePhotographer}
        onTogglePhase={togglePhase}
        onClearAll={clearAll}
      />
      <main className="px-4 sm:px-8 lg:px-12">
        <Gallery
          filteredByPhase={filteredByPhase}
          flatFilteredPhotos={flatFilteredPhotos}
          onPhotoClick={setLightboxIndex}
        />
      </main>
      <LightboxWrapper
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        slides={flatFilteredPhotos}
        onClose={() => setLightboxIndex(-1)}
      />
    </div>
  );
}
```

---

### `site/src/components/Filters.jsx` (component, event-driven)

**Source:** RESEARCH.md §Phase Requirements FILT-01–FILT-04 + CONTEXT.md D-08 through D-12

**Critical constraints:**
- Sticky top bar (`sticky top-0 z-10`) — always visible (D-08).
- Face filter: render `null` (not `display:none`) when `people.length === 0` — FILT-04.
- "Clear all" button label: `'הצג הכל'` — RESEARCH.md FILT-03.
- RTL: use logical padding utilities `ps-`, `pe-` not `pl-`, `pr-`.
- Chip active state uses `bg-stone-800 text-white`; inactive uses `bg-stone-200 text-stone-700`.
- `PHOTOGRAPHER_NAMES` and `PHASE_LABELS` from `@/config` — no hard-coded Hebrew strings.

```jsx
// site/src/components/Filters.jsx
import { PHASE_LABELS, PHASE_ORDER, PHOTOGRAPHER_NAMES } from '@/config';
import { Button } from '@/components/ui/button';

export default function Filters({
  people,
  selectedPhotographers,
  selectedPhases,
  onTogglePhotographer,
  onTogglePhase,
  onClearAll,
}) {
  const hasActiveFilters =
    selectedPhotographers.size > 0 || selectedPhases.size > 0;

  return (
    <div className="sticky top-0 z-10 bg-stone-100 border-b border-stone-200 px-4 sm:px-8 lg:px-12 py-3">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Photographer filter chips */}
        {Object.entries(PHOTOGRAPHER_NAMES).map(([label, name]) => (
          <button
            key={label}
            onClick={() => onTogglePhotographer(label)}
            className={`px-3 py-2 rounded-full text-sm min-h-[44px] transition-colors ${
              selectedPhotographers.has(label)
                ? 'bg-stone-800 text-white'
                : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
            }`}
          >
            {name}
          </button>
        ))}

        {/* Phase filter chips */}
        {PHASE_ORDER.map(phase => (
          <button
            key={phase}
            onClick={() => onTogglePhase(phase)}
            className={`px-3 py-2 rounded-full text-sm min-h-[44px] transition-colors ${
              selectedPhases.has(phase)
                ? 'bg-stone-800 text-white'
                : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
            }`}
          >
            {PHASE_LABELS[phase]}
          </button>
        ))}

        {/* Face filter — conditional render (NOT CSS hide) */}
        {people.length > 0 && (
          <div>{/* face filter UI — Phase 2 */}</div>
        )}

        {/* Clear all */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={onClearAll} className="min-h-[44px]">
            הצג הכל
          </Button>
        )}
      </div>
    </div>
  );
}
```

---

### `site/src/components/Gallery.jsx` (component, transform)

**Source:** RESEARCH.md §Architecture Patterns — component tree diagram + CONTEXT.md D-04, D-05, D-06

**Critical constraints:**
- Iterates `PHASE_ORDER` (from `@/config`) — never the keys of `filteredByPhase` directly,
  as object key order is not guaranteed.
- Sections are **conditionally rendered** (`&&`), not CSS-hidden (D-05, Pitfall 4).
- Passes `flatFilteredPhotos` and a `findIndex` helper to `GallerySection` so each
  `PhotoCard` knows its index within the flat filtered array (for lightbox `index` prop).

```jsx
// site/src/components/Gallery.jsx
import { PHASE_ORDER } from '@/config';
import GallerySection from '@/components/GallerySection';
import EmptyState from '@/components/EmptyState';

export default function Gallery({ filteredByPhase, flatFilteredPhotos, onPhotoClick }) {
  const hasAnyPhoto = PHASE_ORDER.some(
    phase => (filteredByPhase[phase] || []).length > 0
  );

  if (!hasAnyPhoto) return <EmptyState />;

  return (
    <div className="py-8 space-y-8">
      {PHASE_ORDER.map(phase => {
        const sectionPhotos = filteredByPhase[phase] || [];
        // Conditional render — section absent from DOM when empty (D-05)
        if (sectionPhotos.length === 0) return null;
        return (
          <GallerySection
            key={phase}
            phase={phase}
            photos={sectionPhotos}
            flatFilteredPhotos={flatFilteredPhotos}
            onPhotoClick={onPhotoClick}
          />
        );
      })}
    </div>
  );
}
```

---

### `site/src/components/GallerySection.jsx` (component, transform)

**Source:** RESEARCH.md §Pattern 4 (react-masonry-css) + UI-SPEC §2 (spacing) + §3 (typography)

**Critical constraints:**
- Section header is `sticky` with `top-[64px]` (below the 64px filter bar — UI-SPEC space-16).
- Header shows Hebrew phase name (`PHASE_LABELS[phase]`) + photo count.
- `Masonry` component from `react-masonry-css` — `breakpointCols` object with responsive
  column counts.
- CSS classes `masonry-grid` and `masonry-grid_column` must exist in `index.css` (Pitfall 6).
- The flat index for lightbox: find position of each photo in `flatFilteredPhotos`.

```jsx
// site/src/components/GallerySection.jsx
import Masonry from 'react-masonry-css';
import { PHASE_LABELS } from '@/config';
import PhotoCard from '@/components/PhotoCard';

const BREAKPOINT_COLS = {
  default: 5,
  1280: 5,
  1024: 4,
  640: 3,
  0: 2,
};

export default function GallerySection({
  phase,
  photos,
  flatFilteredPhotos,
  onPhotoClick,
}) {
  return (
    <section>
      {/* Sticky section header, below sticky filter bar */}
      <div className="sticky top-16 z-[5] bg-stone-50/90 backdrop-blur-sm py-3 mb-4">
        <h2 className="text-[22px] font-semibold leading-tight text-stone-800">
          {PHASE_LABELS[phase]}
          <span className="ms-2 text-sm font-normal text-stone-500">
            {photos.length}
          </span>
        </h2>
      </div>

      <Masonry
        breakpointCols={BREAKPOINT_COLS}
        className="masonry-grid"
        columnClassName="masonry-grid_column"
      >
        {photos.map(photo => {
          const flatIndex = flatFilteredPhotos.indexOf(photo);
          return (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onClick={() => onPhotoClick(flatIndex)}
            />
          );
        })}
      </Masonry>
    </section>
  );
}
```

---

### `site/src/components/PhotoCard.jsx` (component, event-driven)

**Source:** CONTEXT.md D-13, D-14 + UI-SPEC §4 (colors) + §2 (spacing)

**Critical constraints:**
- Thumbnail uses `<img src={photo.thumb_url} loading="lazy">` — lazy loading mandatory
  (RESEARCH.md anti-pattern: "Rendering all 1300 photos without loading='lazy'").
- Photographer credit badge: hover-only overlay at bottom-inline-end corner (D-13).
  Use `opacity-0 group-hover:opacity-100` transition — not JS state.
- Credit shows `PHOTOGRAPHER_NAMES[photo.photographer]` — real name, not key (D-14).
- `group` class on the container enables `group-hover:` children.
- RTL: `bottom-0 end-0` (logical), not `bottom-0 right-0` (physical).

```jsx
// site/src/components/PhotoCard.jsx
import { PHOTOGRAPHER_NAMES } from '@/config';

export default function PhotoCard({ photo, onClick }) {
  return (
    <div
      className="relative group cursor-pointer overflow-hidden rounded-sm mb-0"
      onClick={onClick}
    >
      <img
        src={photo.thumb_url}
        alt=""
        loading="lazy"
        className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.02]"
      />
      {/* Photographer credit — hover only, bottom-inline-end corner */}
      <div className="absolute bottom-0 end-0 m-1.5 px-2 py-1 rounded bg-black/50 text-white text-[13px] leading-snug opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        {PHOTOGRAPHER_NAMES[photo.photographer] ?? photo.photographer}
      </div>
    </div>
  );
}
```

---

### `site/src/components/Lightbox.jsx` (component, event-driven)

**Source:** RESEARCH.md §Pattern 3 (yarl RTL config) + CONTEXT.md D-07

**Critical constraints:**
- `slides` prop must be `flatFilteredPhotos` — the currently filtered set, NOT all photos (GALL-04, Pitfall 3).
- `index` prop is the position of clicked photo within `flatFilteredPhotos`.
- `portal={{ container: { dir: 'rtl' } }}` required — yarl portals escape the DOM tree
  and may not inherit `dir="rtl"` from `<html>` (RESEARCH.md §Pattern 3).
- Map `photo.r2_url` to yarl `{ src }` slide shape.
- `open={false}` when `index < 0`.

```jsx
// site/src/components/Lightbox.jsx
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

export default function LightboxWrapper({ open, index, slides, onClose }) {
  const yarlSlides = slides.map(photo => ({ src: photo.r2_url, alt: photo.id }));

  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={yarlSlides}
      index={index}
      portal={{ container: { dir: 'rtl' } }}
    />
  );
}
```

---

### `site/src/components/LoadingSkeleton.jsx` (component)

**Source:** CONTEXT.md (Claude's Discretion — loading state) + UI-SPEC §4 (colors)

**Pattern:** Skeleton grid mimics the masonry layout. Uses Tailwind `animate-pulse`.
No content, no text. Full-screen stone-50 background.

```jsx
// site/src/components/LoadingSkeleton.jsx
export default function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-stone-50 p-4 sm:p-8">
      {/* Skeleton filter bar */}
      <div className="h-16 bg-stone-100 rounded mb-8 animate-pulse" />
      {/* Skeleton photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="bg-stone-200 rounded animate-pulse"
            style={{ aspectRatio: i % 3 === 0 ? '3/4' : '4/3' }}
          />
        ))}
      </div>
    </div>
  );
}
```

---

### `site/src/components/ErrorState.jsx` (component)

**Source:** RESEARCH.md §Code Examples (shadcn Button) + CONTEXT.md (Claude's Discretion — error state)

**Pattern:** Uses shadcn `Button` component. Shows Hebrew error message and a reload button.

```jsx
// site/src/components/ErrorState.jsx
import { Button } from '@/components/ui/button';

export default function ErrorState({ error }) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center space-y-4 p-8">
        <p className="text-stone-600 text-lg">לא ניתן לטעון את התמונות</p>
        {error?.message && (
          <p className="text-stone-400 text-sm font-mono">{error.message}</p>
        )}
        <Button onClick={() => window.location.reload()}>
          נסה שנית
        </Button>
      </div>
    </div>
  );
}
```

---

### `site/src/components/EmptyState.jsx` (component)

**Source:** CONTEXT.md D-05 — shows when all sections filtered to empty

**Pattern:** Simple centered message. Hebrew text. No action button (filters are still
visible in the sticky bar for the user to adjust).

```jsx
// site/src/components/EmptyState.jsx
export default function EmptyState() {
  return (
    <div className="py-24 text-center text-stone-400 text-lg">
      לא נמצאו תמונות לפי הסינון שנבחר
    </div>
  );
}
```

---

## Shared Patterns

### RTL Logical Properties
**Apply to:** All components with padding, margin, or positional classes

Use Tailwind logical utilities exclusively. Never use physical `pl-`, `pr-`, `ml-`, `mr-`
in component code — they do not flip in RTL.

| Instead of | Use |
|------------|-----|
| `pl-4` / `pr-4` | `ps-4` / `pe-4` |
| `ml-2` / `mr-2` | `ms-2` / `me-2` |
| `right-0` | `end-0` |
| `left-0` | `start-0` |
| `text-left` / `text-right` | `text-start` / `text-end` |

Use `rtl:` prefix variants **only** for overriding library-generated physical properties
(e.g., forcing yarl nav arrows to flip if the portal pattern doesn't fully inherit `dir`).

---

### Config Import Pattern
**Apply to:** All components that display Hebrew strings or iterate phase/photographer lists

```js
import { PHASE_LABELS, PHASE_ORDER, PHOTOGRAPHER_NAMES } from '@/config';
```

No Hebrew string literals in component files. Every visible string comes from `config.js`
or is derived from it. This is the single-source-of-truth principle from the pipeline
(`pipeline/config.yaml` equivalent for the frontend).

---

### Conditional Render Pattern (not CSS hide)
**Apply to:** `Gallery.jsx` per-section render, `Filters.jsx` face filter

Empty states and gated features are removed from the DOM entirely with `&&` or early `return null`.
CSS `display:none` / `visibility:hidden` is NOT used for these cases because:
1. Section DOM removal prevents lazy-loaded images in filtered sections from loading.
2. Face filter absence from DOM is the FILT-04 spec requirement.

```jsx
// Correct — removes from DOM
{sectionPhotos.length > 0 && <GallerySection ... />}
{people.length > 0 && <FaceFilter ... />}

// Wrong — stays in DOM, images may still load
<GallerySection style={{ display: sectionPhotos.length ? 'block' : 'none' }} ... />
```

---

### Default Export Pattern
**Apply to:** All component files (`*.jsx`)

Every component file uses `export default function ComponentName()`.
Hook files (`*.js`) use named exports: `export function useHookName()`.

Pipeline analog: `if __name__ == "__main__": main()` — each file has a single clear
entry point; no module exports multiple top-level things.

---

### shadcn `Button` Import
**Apply to:** `ErrorState.jsx`, `Filters.jsx` clear-all button

```jsx
import { Button } from '@/components/ui/button';
```

The `button` component file is generated by `npx shadcn@latest add button` during
scaffolding. Do not hand-write this component.

---

### Masonry CSS Dependency
**Apply to:** `GallerySection.jsx` + `index.css`

`react-masonry-css` applies class names `masonry-grid` and `masonry-grid_column` to
its rendered elements but does NOT ship CSS. Both classes must be declared in `index.css`
(see §`site/src/index.css` above). If missing, columns render stacked vertically.

---

## No Analog Found (Greenfield)

All 17 files have no analog in the current codebase. The `site/` directory does not exist.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `site/index.html` | config | — | No HTML files in project |
| `site/vite.config.js` | config | — | No Vite configuration exists |
| `site/jsconfig.json` | config | — | No JS project config exists |
| `site/src/index.css` | config | — | No CSS files exist |
| `site/src/main.jsx` | entry-point | — | No React entry points exist |
| `site/src/config.js` | config/utility | — | No JS config modules exist |
| `site/src/App.jsx` | root-component | request-response | No React components exist |
| `site/src/hooks/usePhotos.js` | hook | request-response | No hooks exist |
| `site/src/hooks/useFilters.js` | hook | transform | No hooks exist |
| `site/src/components/Filters.jsx` | component | event-driven | No components exist |
| `site/src/components/Gallery.jsx` | component | transform | No components exist |
| `site/src/components/GallerySection.jsx` | component | transform | No components exist |
| `site/src/components/PhotoCard.jsx` | component | event-driven | No components exist |
| `site/src/components/Lightbox.jsx` | component | event-driven | No components exist |
| `site/src/components/LoadingSkeleton.jsx` | component | — | No components exist |
| `site/src/components/ErrorState.jsx` | component | — | No components exist |
| `site/src/components/EmptyState.jsx` | component | — | No components exist |

**Pattern source for all files:** RESEARCH.md verified examples + official library
documentation. Planner should treat RESEARCH.md as the authoritative analog source
and all code excerpts in this document as the concrete patterns to copy.

---

## Metadata

**Analog search scope:** `/Users/omrimelcer/dev/wedding-photos-website/` (excluding `.venv/`)
**Files scanned:** 20 project source files (14 Python pipeline, 1 Python stub, 5 test files)
**React/JS files found:** 0
**Pattern extraction sources:** RESEARCH.md, CONTEXT.md, 04-UI-SPEC.md, pipeline/config.yaml, pipeline/output/metadata.json
**Pattern extraction date:** 2026-05-16
