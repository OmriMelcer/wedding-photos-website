# Phase 4: React Site - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 04-react-site
**Areas discussed:** UI library & aesthetic, Gallery section layout, Lightbox, Filter logic & placement, Photographer credit

---

## UI Library & Aesthetic

| Option | Description | Selected |
|--------|-------------|----------|
| Tailwind CSS + shadcn/ui | Clean, RTL-ready, modern, minimal | ✓ (Claude discretion) |
| MUI / Ant Design | Heavier component libraries with RTL support | |
| Plain CSS | No library | |

**User's choice:** User delegated: "you know what, I trust u, make the UI subtle, yet modern, aesthetic, and such."
**Notes:** User gave full aesthetic discretion to Claude. Claude selected Tailwind + shadcn/ui for its RTL compatibility via `dir="rtl"` and minimal-yet-polished aesthetic.

---

## Filter Logic

| Option | Description | Selected |
|--------|-------------|----------|
| AND logic | Both photographer and phase filters narrow the set | ✓ |
| OR logic | Either filter expands the set | |

**User's choice:** AND — "Only Photographer A's hupa photos" (not all of A's photos plus all hupa photos).
**Notes:** Within each filter group (photographers, phases) it's OR (select A or B). Across groups it's AND.

---

## Filter Bar Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Sticky top bar | Always visible, simple | ✓ |
| Sidebar + mobile drawer | More screen space for photos, more complex | |

**User's choice:** Sticky top bar.

---

## Gallery Section Layout When Filtered

| Option | Description | Selected |
|--------|-------------|----------|
| Always keep 5 phase sections | Sections always visible even when filtering | ✓ |
| Flat grid when filters are active | No phase headers in filtered view | |

**User's choice:** Always keep 5 phase sections — preserves wedding narrative.

---

## Empty Phase Sections

| Option | Description | Selected |
|--------|-------------|----------|
| Collapse completely | Header disappears when section has 0 matching photos | ✓ |
| Keep header with 0 message | Show "0 photos" placeholder | |

**User's choice:** Collapse completely — cleaner.

---

## Photographer Credit on Thumbnails

| Option | Description | Selected |
|--------|-------------|----------|
| Hover overlay | Name appears on hover/tap-hold, invisible at rest | ✓ |
| Always-visible corner badge | Semi-transparent pill always shown | |
| Color-coded border stripe | Color per photographer, no text | |

**User's choice:** Hover overlay.
**Notes:** User initiated this requirement unprompted — "I want the UI to make it relatively clear who the photographer was (for best practice and fairness)." This was not in the original requirements; it's an additive but in-scope UX decision.

---

## Photographer Name vs. Label

| Option | Description | Selected |
|--------|-------------|----------|
| Real name from config.yaml | e.g., "דנה כהן" | ✓ |
| Short label A/B/C | Generic | |

**User's choice:** Real name from config.yaml.

---

## Claude's Discretion

- Exact Tailwind theme colors, typography scale, spacing
- Thumbnail aspect ratio handling in masonry
- Loading / skeleton state while metadata.json fetches
- Error state if fetch fails
- Hover animation timing and badge style for photographer credit
- Mobile breakpoints for masonry column count
- Masonry library selection: `react-masonry-css`
- Lightbox library: `yet-another-react-lightbox` (yarl)
- Phase name config location: `site/src/config.js`

## Deferred Ideas

None — discussion stayed within Phase 4 scope.
