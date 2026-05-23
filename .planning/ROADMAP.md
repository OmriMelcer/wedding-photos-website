# Roadmap: Wedding Photo Album

## Milestones

- ✅ **v1.0 MVP** — Phases 1–5 (shipped 2026-05-17)
- ✅ **v1.1 Security & Hardening** — Phases 6–8 (shipped 2026-05-18)
- **v1.2 Downloads & Album Links** — Phase 9 (current)

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

### v1.2 Downloads & Album Links

- [ ] **Phase 9: Downloads & Album Links** - Guests can download photos and jump to source albums from the gallery

## Phase Details

### Phase 9: Downloads & Album Links
**Goal**: Guests can download individual photos directly from the gallery and access the original source albums in one click
**Depends on**: Phase 8 (live site with photos on R2)
**Requirements**: DWNL-01, DWNL-02, LINK-01, LINK-02, CONF-01
**Success Criteria** (what must be TRUE):
  1. Guest clicks a download button in the lightbox and receives the currently viewed photo as a file download
  2. Guest hovers over a gallery card and sees a download icon; clicking it downloads that photo
  3. Top bar displays 4 album link buttons (3 Google Photos + 1 pic-time) on the left side
  4. Clicking any album link opens the source album in a new browser tab
  5. Album URLs can be updated by editing `site/src/config.js` without touching any component file
**Plans**: 3 plans
  - [ ] 09-01-PLAN.md — Add ALBUM_LINKS to config.js + TopBar component (CONF-01, LINK-01, LINK-02)
  - [ ] 09-02-PLAN.md — PhotoCard hover-visible download icon (DWNL-02)
  - [ ] 09-03-PLAN.md — Lightbox yarl Download plugin + per-slide download metadata (DWNL-01)
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
| 9. Downloads & Album Links | v1.2 | 0/3 | Planning | - |
