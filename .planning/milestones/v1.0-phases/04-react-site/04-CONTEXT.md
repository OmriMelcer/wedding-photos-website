# Phase 4: React Site - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the static React gallery that wedding guests use to browse ~1300 photos. Covers: Vite+React scaffold in `site/`, masonry gallery grouped into 5 Hebrew-titled phase sections, lightbox with navigation, photographer+phase filters, and all Hebrew RTL UI. No backend — site fetches `metadata.json` from R2 on load and does all filtering in-memory.

Requirements in scope: GALL-01, GALL-02, GALL-03, GALL-04, FILT-01, FILT-02, FILT-03, FILT-04, DSGN-01, I18N-01, I18N-02, I18N-03.

</domain>

<decisions>
## Implementation Decisions

### UI Library & Design System
- **D-01:** Tailwind CSS + shadcn/ui. Subtle, modern aesthetic. User delegated design choices to Claude with explicit "make it subtle, yet modern, aesthetic."
- **D-02:** RTL layout via `dir="rtl"` on the HTML root element. Tailwind's `rtl:` variants handle directional overrides.

### Gallery Layout
- **D-03:** Masonry grid using `react-masonry-css` (lightweight, no JS layout engine). Photos ordered by `sort_key` from metadata.json within each section.
- **D-04:** 5 fixed phase sections in wedding order: prep → photoshooting → dining → hupa → dancing. Each section has a sticky Hebrew phase header above its masonry grid.
- **D-05:** When filters make a section empty, the section (header + grid) collapses completely — no "0 photos" placeholder. Only sections with matching photos appear.
- **D-06:** Even when filters are active, photos always stay in their phase sections (not flattened into a single unsectioned grid). The wedding narrative is preserved.

### Lightbox
- **D-07:** `yet-another-react-lightbox` (yarl). Handles mobile swipe, RTL-aware, and navigates through the currently filtered set (not all photos). Previous/next navigation respects active filters.

### Filter Bar
- **D-08:** Sticky top bar — always visible, no sidebar or drawer variant needed.
- **D-09:** AND logic across filter groups: a photo must match the selected photographer AND the selected phase to appear. Each group is multi-select (selecting multiple photographers within the group is OR within that group — shows A or B photos, not just A).
- **D-10:** Live filtering — no "apply" button. All filtering is in-memory, instant.
- **D-11:** Clear all button resets both photographer and phase filters to show all photos.
- **D-12:** Face filter control (FILT-04): hidden entirely when `people.length === 0`. No placeholder or greyed-out state.

### Photographer Credit
- **D-13:** Hover overlay on each thumbnail — photographer's real name (from `photographer_name` in `config.yaml`) appears in a subtle badge at the bottom-right corner on hover (mouse) or tap-hold (mobile). No credit visible at rest.
- **D-14:** Credit uses the real name, not the A/B/C label. The React app maps `photographer` metadata keys to display names using the same key→name config that the filter chips use.

### Phase Name Localization
- **D-15:** Phase key-to-Hebrew string mapping lives in `site/src/config.js` (or equivalent). Not hard-coded inline — a single map object that can be updated without touching component logic. Example: `{ prep: 'הכנות', photoshooting: 'צילומים', dining: 'ארוחה', hupa: 'חופה', dancing: 'ריקודים' }`.

### Claude's Discretion
- Exact Tailwind theme colors, typography scale, and spacing
- Thumbnail aspect ratio behavior in masonry (variable height is fine — masonry)
- Loading state while metadata.json is being fetched (skeleton or spinner)
- Error state if metadata.json fetch fails
- Exact hover animation timing and style for photographer credit badge
- Mobile breakpoints for masonry column count

</decisions>

<specifics>
## Specific Ideas

- User explicitly requested photographer credit on thumbnails for "fairness" — this was an unprompted requirement. It should be tasteful (hover-only) and not clutter the gallery.
- "Subtle, yet modern, aesthetic" — the gallery should feel like a premium photo product, not a stock photo site. Think clean whitespace, soft shadows, smooth transitions.
- Phase sections are the backbone of the UX. Even with filters active, the wedding story should be legible through the section structure.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema and spec
- `wedding_album_spec.md` — Full project spec; metadata.json schema (id, filename, r2_url, thumb_url, photographer, timestamp, cluster, cluster_confidence, sort_key, faces, people); site architecture
- `.planning/REQUIREMENTS.md` §GALL-01–GALL-04, FILT-01–FILT-04, DSGN-01, I18N-01–I18N-03 — All site requirements and acceptance criteria

### Pipeline output (data contract)
- `pipeline/config.yaml` — Contains photographer_name mapping and event time windows; the React site's config derives display names from the same keys
- `pipeline/output/metadata.json` (generated) — Actual data the site consumes at runtime; includes `sort_key` field that controls photo order within sections

### Prior phase context
- `.planning/phases/03-pipeline-upload/03-CONTEXT.md` — D-01/D-02 define R2 URL structure (`{r2_public_url}/photos/{id}.jpg`, `{r2_public_url}/thumbs/{id}.jpg`); D-05 confirms `sort_key` is preserved in uploaded metadata.json

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `pipeline/config.yaml`: contains photographer labels (A/B/C) and names — the React site's `src/config.js` should mirror the photographer key→name mapping from here
- `pipeline/output/metadata.json`: the actual runtime data contract; includes `sort_key` (int), `cluster` (one of 5 string literals), `photographer` (string key), `r2_url`, `thumb_url`

### Established Patterns
- No `site/` directory exists yet — this phase scaffolds the entire frontend from scratch with `npm create vite@latest site -- --template react`
- Pipeline uses `config.yaml` as config source; React site mirrors this pattern with a `src/config.js` for display-facing strings (phase labels, photographer names)
- 5 cluster values in non-standard order: `prep`, `photoshooting`, `dining`, `hupa`, `dancing` (dining before hupa — this is the real wedding schedule, do not reorder)
- Photographer keys: `photographer_a`, `photographer_b`, `photographer_c` (or matching config.yaml labels)

### Integration Points
- Runtime: site fetches `metadata.json` from R2 via the `r2_public_url` configured in `pipeline/config.yaml`
- Build: `npm run build` → `site/dist/` → deployed to Cloudflare Pages (Phase 5)
- Face filter gate: check `data.people.length === 0` after fetching metadata.json; hide face filter if true
- CORS: R2 bucket will be configured in Phase 5 — for local dev, metadata.json can be served from `site/public/` as a fixture

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-react-site*
*Context gathered: 2026-05-16*
