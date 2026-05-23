# Requirements: Wedding Photo Album

**Defined:** 2026-05-18
**Milestone:** v1.2 Downloads & Album Links
**Core Value:** Every guest can find and view every photo from the wedding, filtered by who shot it and when it happened — with zero hosting costs and no maintenance burden.

## v1.2 Requirements

### Download

- [x] **DWNL-01**: User can download the currently viewed photo from the lightbox (fetches R2 URL, triggers browser download with original filename)
- [x] **DWNL-02**: User can download a photo from the gallery grid via a download icon that appears on hover

### Album Links

- [x] **LINK-01**: Top bar displays 4 buttons/links to the original source albums (3 Google Photos + 1 pic-time), placed on the left side of the top bar
- [x] **LINK-02**: Each album link opens in a new tab

### Configuration

- [x] **CONF-01**: Album URLs are stored in `site/src/config.js` (not hardcoded in components) so they can be updated without touching component code

## Future Requirements

### Face Recognition (v2)

- **FACE-01**: Face recognition pipeline: detect faces, cluster into person identities
- **FACE-02**: User labels face clusters with names
- **FACE-03**: metadata.json updated with `faces[]` and `people[]` arrays — photo ID lists per person, no raw embeddings
- **FACE-04**: Site face filter becomes visible and functional when `people.length > 0` (zero code change on site side)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-photo selection + ZIP download | Added complexity; single-photo download covers the core use case |
| Linking individual photos to their source URL | Pipeline doesn't store per-photo source URLs; would require re-ingest |
| Download password / access gate | Photos are already publicly accessible; no new surface added |
| Full-resolution originals on R2 | Pipeline re-run + storage cost; web-compressed 2000px is sufficient for printing |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DWNL-01 | Phase 9 | Complete |
| DWNL-02 | Phase 9 | Complete |
| LINK-01 | Phase 9 | Complete |
| LINK-02 | Phase 9 | Complete |
| CONF-01 | Phase 9 | Complete |

**Coverage:**
- v1.2 requirements: 5 total
- Mapped to phases: 5
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-18*
*Last updated: 2026-05-18 after roadmap creation (Phase 9 assigned)*
