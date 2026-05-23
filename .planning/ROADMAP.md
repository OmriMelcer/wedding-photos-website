# Roadmap: Wedding Photo Album

## Milestones

- ✅ **v1.0 MVP** — Phases 1–5 (shipped 2026-05-17)
- ✅ **v1.1 Security & Hardening** — Phases 6–8 (shipped 2026-05-18)
- ✅ **v1.2 Downloads & Album Links** — Phase 9 (shipped 2026-05-23)
- **v1.3 Lightbox Zoom** — Phase 10 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–5) — SHIPPED 2026-05-17</summary>

- [x] Phase 1: Photo Acquisition (3/3 plans) — completed 2026-05-16
- [x] Phase 2: Pipeline Processing (5/5 plans) — completed 2026-05-16
- [x] Phase 3: Pipeline Upload (2/2 plans) — completed 2026-05-16
- [x] Phase 4: React Site (4/4 plans) — completed 2026-05-17
- [x] Phase 5: Infrastructure & Deployment (2/2 plans) — completed 2026-05-17

Full archive: `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 Security & Hardening (Phases 6–8) — SHIPPED 2026-05-18</summary>

- [x] Phase 6: Pipeline Code Changes (2/2 plans) — completed 2026-05-17
- [x] Phase 7: Cloudflare Hardening (1/1 plans) — completed 2026-05-17
- [x] Phase 8: Re-upload (1/1 plans) — completed 2026-05-18

Full archive: `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v1.2 Downloads & Album Links (Phase 9) — SHIPPED 2026-05-23</summary>

- [x] Phase 9: Downloads & Album Links (3/3 plans) — completed 2026-05-23

Full archive: `.planning/milestones/v1.2-ROADMAP.md`

</details>

### v1.3 Lightbox Zoom

- [ ] **Phase 10: Zoom & Pan** - Add pinch-to-zoom, scroll-wheel zoom, and drag-to-pan to the lightbox

## Phase Details

### Phase 10: Zoom & Pan
**Goal**: Guests can zoom in on any lightbox photo and pan around the zoomed image, on both mobile and desktop
**Depends on**: Phase 9 (lightbox with Download plugin already wired)
**Requirements**: ZOOM-01, ZOOM-02, ZOOM-03
**Success Criteria** (what must be TRUE):
  1. Guest on iPhone can spread two fingers to zoom in on a lightbox photo and pinch to zoom back out
  2. Guest on desktop can scroll the mouse wheel over a lightbox photo to zoom in and out
  3. Guest can drag a zoomed-in lightbox photo to pan and reveal different parts of the image
  4. After a fast pinch-out on iPhone, the guest can immediately swipe to the next photo (no swipe-block)
  5. Zoom controls (zoom in / zoom out buttons) display Hebrew tooltips ("הגדל" / "הקטן") matching the existing Hebrew UI
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Photo Acquisition | v1.0 | 3/3 | Complete | 2026-05-16 |
| 2. Pipeline Processing | v1.0 | 5/5 | Complete | 2026-05-16 |
| 3. Pipeline Upload | v1.0 | 2/2 | Complete | 2026-05-16 |
| 4. React Site | v1.0 | 4/4 | Complete | 2026-05-17 |
| 5. Infrastructure & Deployment | v1.0 | 2/2 | Complete | 2026-05-17 |
| 6. Pipeline Code Changes | v1.1 | 2/2 | Complete | 2026-05-17 |
| 7. Cloudflare Hardening | v1.1 | 1/1 | Complete | 2026-05-17 |
| 8. Re-upload | v1.1 | 1/1 | Complete | 2026-05-18 |
| 9. Downloads & Album Links | v1.2 | 3/3 | Complete | 2026-05-23 |
| 10. Zoom & Pan | v1.3 | 0/? | Not started | - |
