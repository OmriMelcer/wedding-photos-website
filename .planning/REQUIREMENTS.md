# Requirements: Wedding Photo Album

**Defined:** 2026-05-16
**Core Value:** Every guest can find and view every photo from the wedding, filtered by who shot it and when it happened — with zero hosting costs and no maintenance burden.

## v1 Requirements

### Photo Acquisition

- [ ] **ACQN-01**: Pipeline automatically downloads photos from all 3 Google Photos shared albums
- [ ] **ACQN-02**: Pipeline automatically downloads photos from pic-time gallery (justsmile.pic-time.com/gallery, open access)
- [ ] **ACQN-03**: Manual download steps documented as fallback when auto-download fails for either source

### Pipeline — Processing

- [ ] **PIPE-01**: EXIF timestamps extracted from digital photos and normalized to GMT+02:00 (Israel Standard Time)
- [ ] **PIPE-02**: Photographer tag assigned per source folder, mapped to Photographer A, B, or C via config.yaml
- [ ] **PIPE-03**: CLIP ViT-B/32 embeddings computed for ALL photos (both digital and film); images are blurred and downscaled before inference to maximise speed — this pre-processing is for clustering only, not applied to website images
- [ ] **PIPE-04**: Digital photos assigned to event cluster via EXIF timestamp against config.yaml time windows (all times GMT+02:00): prep 08:00–14:00, photoshooting 14:00–16:10, dining 16:10–18:00, hupa 18:00–18:40, dancing 18:40–end
- [ ] **PIPE-05**: Per-cluster centroids computed from the CLIP embeddings of EXIF-labeled digital photos; film photos (no EXIF) assigned to nearest centroid via KNN in the same embedding space
- [ ] **PIPE-06**: cluster_confidence score computed for every photo; assignments below a threshold are flagged for human review before upload
- [ ] **PIPE-07**: Photos resized to web quality and thumbnails generated per photo for gallery display

### Pipeline — Upload

- [ ] **UPLD-01**: Compressed photos and thumbnails uploaded to Cloudflare R2
- [ ] **UPLD-02**: metadata.json generated and uploaded to Cloudflare R2
- [ ] **UPLD-03**: pipeline/config.yaml defines event time windows, photographer names, R2 credentials, and confidence threshold

### Site — Gallery

- [ ] **GALL-01**: metadata.json fetched from R2 on page load; all filtering and state managed in-memory
- [ ] **GALL-02**: Photos displayed in a responsive masonry grid using thumbnail URLs, with the grid visually grouped into sections by wedding phase, each section headed by a Hebrew phase title
- [ ] **GALL-03**: Lightbox opens on photo click, displaying the full-resolution image
- [ ] **GALL-04**: Lightbox supports previous/next navigation through the currently filtered photo set

### Site — Filters

- [ ] **FILT-01**: User can filter photos by photographer (multi-select: A, B, C)
- [ ] **FILT-02**: User can filter photos by wedding phase (multi-select across all 5 phases)
- [ ] **FILT-03**: Clear all filters button resets the view to all photos
- [ ] **FILT-04**: Face filter is hidden when people.length === 0 (enables Phase 2 with no code changes)

### Site — Design

- [ ] **DSGN-01**: Gallery design is beautiful, subtle, and interactive; third-party UI libraries and component packages may be used as needed

### Site — Localization

- [ ] **I18N-01**: All displayed UI text is in Hebrew
- [ ] **I18N-02**: Page layout uses RTL (right-to-left) direction
- [ ] **I18N-03**: Event phase cluster keys (prep, photoshooting, dining, hupa, dancing) mapped to Hebrew display strings; English-key → Hebrew-string mapping is a config entry so titles can be updated without code changes

### Infrastructure

- [ ] **INFRA-01**: Cloudflare R2 bucket configured with CORS and public read access
- [ ] **INFRA-02**: React site built with Vite and deployed to Cloudflare Pages via wrangler

## v2 Requirements

### Face Recognition

- **FACE-01**: Offline pipeline detects faces and clusters them into person identities
- **FACE-02**: User labels face clusters with names
- **FACE-03**: metadata.json updated with faces[] and people[] arrays (photo ID lists per person, no raw embeddings)
- **FACE-04**: Site face filter becomes visible and functional when people.length > 0

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend / server | Static-only architecture; no runtime server ever |
| Incremental pipeline | One-shot by design; re-run full pipeline if source photos change |
| Mobile app | Web-first; responsive site covers mobile browsers |
| OAuth / login | Site is public; no authentication needed for guests |
| Real-time updates | No server; updates require re-running the pipeline |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ACQN-01 | — | Pending |
| ACQN-02 | — | Pending |
| ACQN-03 | — | Pending |
| PIPE-01 | — | Pending |
| PIPE-02 | — | Pending |
| PIPE-03 | — | Pending |
| PIPE-04 | — | Pending |
| PIPE-05 | — | Pending |
| PIPE-06 | — | Pending |
| PIPE-07 | — | Pending |
| UPLD-01 | — | Pending |
| UPLD-02 | — | Pending |
| UPLD-03 | — | Pending |
| GALL-01 | — | Pending |
| GALL-02 | — | Pending |
| GALL-03 | — | Pending |
| GALL-04 | — | Pending |
| FILT-01 | — | Pending |
| FILT-02 | — | Pending |
| FILT-03 | — | Pending |
| FILT-04 | — | Pending |
| DSGN-01 | — | Pending |
| I18N-01 | — | Pending |
| I18N-02 | — | Pending |
| I18N-03 | — | Pending |
| INFRA-01 | — | Pending |
| INFRA-02 | — | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 0 (populated during roadmap creation)
- Unmapped: 27

---
*Requirements defined: 2026-05-16*
*Last updated: 2026-05-16 after initial definition*
