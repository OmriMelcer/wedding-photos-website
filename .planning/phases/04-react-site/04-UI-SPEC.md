---
status: draft
phase: "04"
phase_name: react-site
created: "2026-05-16"
design_system: "shadcn/ui + Tailwind CSS"
---

# UI-SPEC: Phase 04 — React Site

## 1. Design System

| Field | Value | Source |
|-------|-------|--------|
| Tool | shadcn/ui + Tailwind CSS | CONTEXT.md D-01 |
| Init state | Not yet initialized (site/ does not exist) | Codebase scan |
| Preset | Initialize during Phase 4 execution via `npx shadcn init` inside `site/` | — |
| Third-party registries | None — shadcn official only | Claude discretion |
| Registry Safety Gate | Not applicable — no third-party blocks declared | — |

shadcn must be initialized after Vite scaffold: `npm create vite@latest site -- --template react`, then `cd site && npx shadcn init`.

---

## 2. Spacing

Scale: 8-point base with 4px micro-unit. All spacing values are multiples of 4px.

| Token | Value | Use |
|-------|-------|-----|
| space-1 | 4px | Icon gap, badge internal padding |
| space-2 | 8px | Chip internal horizontal padding, inline gaps |
| space-3 | 12px | Filter chip vertical padding |
| space-4 | 16px | Section header padding-inline, card gap |
| space-6 | 24px | Filter bar vertical padding, section gap between header and grid |
| space-8 | 32px | Section vertical margin between phase blocks |
| space-12 | 48px | Page horizontal padding (desktop) |
| space-16 | 64px | Top offset for sticky filter bar height budget |

Touch targets: minimum 44px height for all interactive elements (filter chips, lightbox nav buttons). This applies even when visual size is smaller — use padding to reach 44px.

Masonry column gap: 8px (space-2) on mobile, 12px (space-3) on tablet, 16px (space-4) on desktop.

---

## 3. Typography

**Font family:** `Heebo` from Google Fonts — excellent Hebrew glyph coverage, clean geometric sans-serif, works with RTL out of the box. Load via `@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600&display=swap')`.

| Role | Size | Weight | Line-height | Use |
|------|------|--------|-------------|-----|
| Body | 16px | 400 | 1.5 | Filter chip labels, metadata captions |
| Small | 13px | 400 | 1.4 | Photographer credit badge text, photo count |
| Section Heading | 22px | 600 | 1.2 | Hebrew phase section headers (sticky) |
| Page Title | 32px | 600 | 1.2 | Site hero title (if any) |

Exactly 4 sizes, exactly 2 weights (regular 400, semibold 600). No exceptions for this phase.

`font-family: 'Heebo', system-ui, sans-serif` — declare on `<html>` element alongside `dir="rtl"`.

---

## 4. Color Palette

60/30/10 split. Wedding aesthetic: warm white dominant, cool slate secondary, muted blush accent. No saturated colors.

### Dominant — 60% (surface)

| Token | Hex | Tailwind | Use |
|-------|-----|----------|-----|
| surface | #FAFAF9 | `stone-50` | Page background |
| surface-raised | #FFFFFF | white | Card / thumbnail background, lightbox bg |

### Secondary — 30% (structure)

| Token | Hex | Tailwind | Use |
|-------|-----|----------|-----|
| filter-bar-bg | #F4F4F3 | `stone-100` | Sticky filter bar background |
| section-header-bg | rgba(250,250,249,0.9) | `stone-50/90` | Section header sticky background (frosted) |
| chip-default | #E7E5E4 | `stone-200` | Unselected filter chip fill |
| chip-text | #57534E | `stone-600` | Unselected chip label |
| border | #E7E5E4 | `stone-200` | Dividers, chip borders |
| text-secondary | #78716C | `stone-500` | Subtitle text, count labels |

### Accent — 10% (emphasis)

| Token | Hex | Tailwind | Use |
|-------|-----|----------|-----|
| accent | #A8967A | custom warm-gold | Active filter chip fill ONLY |
| accent-text | #FFFFFF | white | Text inside active filter chip |
| accent-hover | #917F66 | custom warm-gold-dark | Active chip hover state |

Accent is reserved exclusively for: active/selected filter chips. It does not appear on section headers, thumbnails, or buttons.

### Semantic

| Token | Hex | Use |
|-------|-----|-----|
| destructive | #DC2626 | Not used in Phase 4 (no destructive actions) |
| text-primary | #1C1917 | `stone-900` — all body text, headings |
| photographer-badge-bg | rgba(0,0,0,0.55) | Hover overlay on thumbnail |
| photographer-badge-text | #FFFFFF | Name text inside hover badge |

### Dark mode

Not in scope for Phase 4. Do not implement dark mode variants. Use `class="light"` on root if shadcn requires explicit mode.

---

## 5. Component Inventory

### 5.1 Filter Bar

**Component:** `Filters.jsx`
**Behavior:** Sticky top bar. Always visible. Two filter groups: photographers and wedding phases. AND logic across groups, OR within each group.

Layout (RTL):
- Bar spans full viewport width
- Filter groups flow right-to-left
- "הצג הכל" (Clear All) button on the left edge (which is visually last in RTL)
- Groups labeled in Hebrew: "צלמים" (Photographers), "שלבים" (Phases)

Chip anatomy:
- Height: 36px (padding to 44px touch target via wrapper)
- Horizontal padding: 12px (space-3)
- Border-radius: 9999px (pill)
- Default state: `chip-default` fill, `chip-text` label, 1px `border` stroke
- Active state: `accent` fill, `accent-text` label, no stroke
- Transition: `background-color 150ms ease, color 150ms ease`

Face filter: rendered only when `people.length > 0`. When `people.length === 0`, the face filter group element must not be in the DOM (use conditional rendering, not CSS hide).

Clear All button:
- Label: "הצג הכל"
- Style: text-only, `text-secondary` color, underline on hover
- Only enabled when any filter is active
- When no filters active: still visible but muted opacity (0.4), cursor default

### 5.2 Phase Section Header

**Component:** Rendered inside `Gallery.jsx` per section.
**Behavior:** Sticky within its section scroll context — sticks below the filter bar as you scroll through that section's photos, then scrolls away when the next section header reaches its position.

Anatomy:
- Full-width rule: 1px `border` stroke above the header text
- Hebrew phase title: 22px / semibold / `text-primary`
- Photo count: 13px / regular / `text-secondary` — format: `(N תמונות)` — in parentheses, space before and after
- Sticky top offset: equals filter bar height (60px) plus 8px margin
- Background: `section-header-bg` (stone-50 at 90% opacity) with `backdrop-filter: blur(8px)` for frosted effect
- Padding-block: 12px top, 8px bottom
- Padding-inline: 0 (inherits page horizontal padding)

Hebrew phase labels (canonical — from `site/src/config.js`):

| Key | Hebrew |
|-----|--------|
| prep | הכנות |
| photoshooting | צילומים |
| dining | ארוחה |
| hupa | חופה |
| dancing | ריקודים |

Phase display order: prep, photoshooting, dining, hupa, dancing (this is the actual wedding timeline — do not alphabetize or reorder).

### 5.3 Masonry Gallery Grid

**Component:** `Gallery.jsx` using `react-masonry-css`.

Column counts by breakpoint:

| Breakpoint | Min-width | Columns |
|------------|-----------|---------|
| xs | 0px | 2 |
| sm | 640px | 3 |
| md | 1024px | 4 |
| lg | 1280px | 5 |

Column gap: 8px at xs/sm, 12px at md, 16px at lg.

Thumbnail behavior:
- Width: 100% of column
- Height: natural (aspect-ratio from metadata if available, otherwise unconstrained — masonry handles variable heights)
- `object-fit: cover` — thumbnails are cropped to fill their natural aspect ratio
- `border-radius: 4px`
- Cursor: pointer
- Loading: `loading="lazy"` on all `<img>` elements

### 5.4 Photographer Credit Hover Overlay

**Component:** Rendered inside each thumbnail card.

Anatomy:
- Position: absolute, pinned to bottom of thumbnail
- Height: 40px (gradient fade from transparent at top to `photographer-badge-bg` at bottom)
- Text: photographer display name, 13px / regular / white, aligned to start (right in RTL)
- Padding-inline-start: 8px, padding-block-end: 8px

Visibility:
- At rest: `opacity: 0`
- On hover (pointer device): `opacity: 1`
- On focus-visible (keyboard): `opacity: 1`
- Transition: `opacity 200ms ease`
- Mobile: revealed on the `touchstart` of the lightbox tap (show briefly before lightbox opens — 150ms delay on lightbox open to allow the badge to render)

Implementation note: wrap each thumbnail in a `<div className="group relative overflow-hidden rounded-sm">` and use Tailwind `group-hover:opacity-100` on the overlay.

### 5.5 Lightbox

**Component:** `Lightbox.jsx` using `yet-another-react-lightbox` (yarl).

Configuration:
- Navigates through the currently filtered photo set only (not all 1300 photos)
- Uses `r2_url` (full-resolution) as the lightbox src
- Previous/next buttons are RTL-aware (yarl supports RTL natively — pass `dir="rtl"` prop or use the RTL plugin)
- Keyboard navigation: arrow keys, Escape to close
- Swipe navigation on mobile
- Background: `rgba(0,0,0,0.92)` — near-black, not pure black
- Controls: minimal — close (X), prev/next arrows. No download button, no share button, no zoom in Phase 4.

Caption (optional bottom bar):
- Photographer display name: 13px / regular / white
- Phase label (Hebrew): 13px / regular / stone-400

### 5.6 Loading State

**When:** While `metadata.json` fetch is in flight (typically < 1 second on a fast connection; may be 2-3 seconds on slow mobile).

Approach: Skeleton placeholders in masonry layout — 12 skeleton cards arranged in a 3-column masonry approximation. Skeleton cards have:
- Background: `stone-200` with `animate-pulse` (Tailwind)
- Border-radius: 4px
- Heights: vary between 120px, 180px, 240px in a repeating pattern to approximate masonry
- No text or labels during skeleton state

Filter bar: visible during load but all chips are disabled (pointer-events-none, opacity 0.5).

### 5.7 Error State

**When:** `metadata.json` fetch fails (network error, CORS error, 4xx/5xx).

Layout: centered card in the viewport, no gallery content.

Content:
- Icon: a simple warning triangle (use a shadcn `AlertTriangle` icon from lucide-react)
- Heading (22px / semibold): "לא ניתן לטעון את התמונות"
- Body (16px / regular / text-secondary): "אירעה שגיאה בטעינת האלבום. אפשר לנסות לרענן את הדף."
- Retry button label: "רענן"
- Button style: shadcn `<Button>` default variant

### 5.8 Empty Gallery State (all filters active, no matching photos)

**When:** Filters are so restrictive that zero photos match across all phases (all sections collapse).

Layout: centered message in the content area, below the filter bar.

Content:
- Body (16px / regular / text-secondary): "אין תמונות התואמות לסינון הנוכחי"
- Clear link below: "הסר סינון" — same style as the Clear All chip in the filter bar

---

## 6. Copywriting Contract

All copy is in Hebrew. No English UI text except proper nouns (e.g., "Magnate Images").

| Element | Hebrew | Notes |
|---------|--------|-------|
| Page title | "האלבום שלנו" | Document `<title>` and hero heading (if any) |
| Filter group: photographers | "צלמים" | Group label above chips |
| Filter group: phases | "שלבים" | Group label above chips |
| Clear all button | "הצג הכל" | Resets both filter groups |
| Photo count suffix | "תמונות" | Used in section header: "(47 תמונות)" |
| Loading skeleton aria-label | "טוען תמונות..." | Screen reader only during skeleton state |
| Error heading | "לא ניתן לטעון את התמונות" | — |
| Error body | "אירעה שגיאה בטעינת האלבום. אפשר לנסות לרענן את הדף." | — |
| Retry button | "רענן" | — |
| Empty state body | "אין תמונות התואמות לסינון הנוכחי" | — |
| Empty state clear link | "הסר סינון" | Calls same handler as Clear All |
| Lightbox close aria-label | "סגור" | — |
| Lightbox prev aria-label | "תמונה קודמת" | — |
| Lightbox next aria-label | "תמונה הבאה" | — |
| Phase: prep | "הכנות" | From config.js |
| Phase: photoshooting | "צילומים" | From config.js |
| Phase: dining | "ארוחה" | From config.js |
| Phase: hupa | "חופה" | From config.js |
| Phase: dancing | "ריקודים" | From config.js |

Photographer display names come from `pipeline/config.yaml` → `photographers[].display_name`. Mirrored verbatim in `site/src/config.js`. Do not hard-code names in component files.

Destructive actions in Phase 4: none. No delete, no overwrite, no confirmation dialogs needed.

---

## 7. Layout & RTL Contract

- `dir="rtl"` declared on `<html>` element in `index.html`
- `lang="he"` declared on `<html>` element
- Use Tailwind `rtl:` variants for any directional overrides (e.g., `rtl:text-right`, `rtl:pl-0 rtl:pr-4`)
- Use CSS logical properties where Tailwind exposes them: `ps-` / `pe-` (padding-inline-start/end), `ms-` / `me-`
- Do not use `float: left/right` or `text-align: left/right` directly — use logical equivalents
- Sticky filter bar: `position: sticky; top: 0; z-index: 50`
- Sticky section headers: `position: sticky; top: 60px; z-index: 40` (below filter bar)
- Page max-width: 1440px, centered with `mx-auto`
- Page horizontal padding: 16px (mobile), 48px (desktop ≥ 1024px)

---

## 8. Animation & Motion

All transitions should feel smooth but fast — "responsive, not decorative."

| Element | Property | Duration | Easing |
|---------|----------|----------|--------|
| Filter chip activate/deactivate | background-color, color | 150ms | ease |
| Photographer badge appear | opacity | 200ms | ease |
| Skeleton pulse | opacity | 1500ms | ease-in-out (loop) |
| Lightbox open/close | yarl default | — | Use yarl defaults |
| Section collapse (filter change) | none | — | Instant — no animate-height; too costly for 5 sections with 1300 images |

Do not add scroll-triggered animations or intersection observer effects. Performance first — ~1300 thumbnails on one page.

---

## 9. Accessibility

- All interactive elements reachable by keyboard (Tab, Shift+Tab)
- Filter chips: `role="button"` or `<button>` element, `aria-pressed` for selected state
- Section headers: `<h2>` (or semantically equivalent heading level)
- Thumbnails: `<img alt="">` with empty alt (decorative) — the photographer credit badge provides context
- Lightbox: trap focus inside when open; Escape closes; full ARIA labeling on nav buttons (see copywriting)
- Skeleton: `role="status"` container with `aria-live="polite"` and `aria-label="טוען תמונות..."`
- Error state: `role="alert"` on the error card
- Color contrast: all text against its background must meet WCAG AA (4.5:1 for body, 3:1 for large text)
  - `stone-900` (#1C1917) on `stone-50` (#FAFAF9): passes AA
  - white on `rgba(0,0,0,0.55)` badge: passes AA
  - white on accent `#A8967A`: verify — if contrast < 4.5:1 at 13px, darken accent to `#8B7A62`

---

## 10. Performance Constraints

- All `<img>` thumbnail elements: `loading="lazy"` + explicit `width` / `height` attributes from metadata (prevents layout shift)
- Lightbox images: load only the active image and one preload each direction (yarl default behavior)
- No animation on scroll, no IntersectionObserver effects
- `metadata.json` fetch: single request on mount in `App.jsx`; no re-fetch on filter change
- `react-masonry-css` is a CSS-only masonry approach (no JS layout recalculation) — appropriate for 1300 items
- No `useEffect` re-runs on every render — memoize filtered photo arrays with `useMemo`

---

## 11. File Structure Contract

The following files are created/modified in Phase 4:

```
site/
  index.html                   # dir="rtl", lang="he", Heebo font import
  src/
    config.js                  # phase label map + photographer name map
    App.jsx                    # root: fetch, filter state, layout
    components/
      Filters.jsx              # sticky filter bar, chip group logic
      Gallery.jsx              # masonry grid + phase sections
      GallerySection.jsx       # single phase section (header + masonry)
      PhotoCard.jsx            # thumbnail + hover badge
      Lightbox.jsx             # yarl wrapper
      LoadingSkeleton.jsx      # skeleton placeholder grid
      ErrorState.jsx           # fetch error card
      EmptyState.jsx           # zero-results message
    hooks/
      usePhotos.js             # fetch + parse metadata.json; returns { photos, people, loading, error }
      useFilters.js            # filter state + filtered photo derivation
```

`site/src/config.js` shape (canonical — do not deviate):

```js
export const PHASE_LABELS = {
  prep: 'הכנות',
  photoshooting: 'צילומים',
  dining: 'ארוחה',
  hupa: 'חופה',
  dancing: 'ריקודים',
};

export const PHASE_ORDER = ['prep', 'photoshooting', 'dining', 'hupa', 'dancing'];

export const PHOTOGRAPHER_NAMES = {
  abir_sultan: 'עביר סולטן',
  inbal_zeldin: 'ענבל זלדין',
  magnate_images: 'Magnate Images',
};

export const METADATA_URL = import.meta.env.VITE_METADATA_URL || '/metadata.json';
```

Local dev fixture: copy a real or synthetic `metadata.json` into `site/public/metadata.json`. `VITE_METADATA_URL` defaults to `/metadata.json` in dev; set to the R2 URL for production builds.

---

## 12. Pre-Populated Decision Traceability

| Decision | Source | Value |
|----------|--------|-------|
| Design system | CONTEXT.md D-01 | Tailwind CSS + shadcn/ui |
| RTL method | CONTEXT.md D-02 | `dir="rtl"` on HTML root; Tailwind `rtl:` variants |
| Masonry library | CONTEXT.md D-03 | react-masonry-css |
| Phase section order | CONTEXT.md D-04 | prep → photoshooting → dining → hupa → dancing |
| Empty section behavior | CONTEXT.md D-05 | Collapse completely — no header shown |
| Sections preserved under filters | CONTEXT.md D-06 | Always sectioned, never flat |
| Lightbox library | CONTEXT.md D-07 | yet-another-react-lightbox (yarl) |
| Filter placement | CONTEXT.md D-08 | Sticky top bar |
| Filter logic | CONTEXT.md D-09 | AND across groups, OR within group |
| Filter mode | CONTEXT.md D-10 | Live (no apply button) |
| Clear all | CONTEXT.md D-11 | "הצג הכל" button |
| Face filter gate | CONTEXT.md D-12 | Hidden (not in DOM) when people.length === 0 |
| Credit reveal | CONTEXT.md D-13 | Hover overlay, bottom-right of thumbnail |
| Credit content | CONTEXT.md D-14 | Real display name from config.js (not A/B/C) |
| Phase label config | CONTEXT.md D-15 | site/src/config.js PHASE_LABELS map |
| Font family | Claude discretion | Heebo (Google Fonts) — Hebrew glyph coverage |
| Color palette | Claude discretion | Warm stone neutrals with warm-gold accent |
| Masonry column counts | Claude discretion | 2/3/4/5 at xs/sm/md/lg |
| Loading state | Claude discretion | Skeleton cards with animate-pulse |
| Error state | Claude discretion | Alert card with retry, Hebrew copy |
| Hover timing | Claude discretion | 200ms ease opacity |
| Mobile credit reveal | Claude discretion | Show on touchstart, 150ms lightbox delay |
| Photographer labels | pipeline/config.yaml | abir_sultan, inbal_zeldin, magnate_images |
| Photographer display names | pipeline/config.yaml | עביר סולטן, ענבל זלדין, Magnate Images |

---

*Status: draft — awaiting checker validation*
*Phase: 04-react-site*
*Written: 2026-05-16*
