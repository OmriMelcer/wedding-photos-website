# Milestones: Wedding Photo Album

## v1.0 MVP — ✅ SHIPPED 2026-05-17

**Phases:** 1–5 | **Plans:** 16 | **Commits:** 69
**Timeline:** 2026-05-16 → 2026-05-17 (2 days)
**LOC:** ~2,750 (Python pipeline + React site)

### Delivered

An end-to-end static wedding photo album: offline Python pipeline acquires, processes (CLIP embeddings + cluster assignment), resizes, and uploads 1327 photos to Cloudflare R2; a Hebrew RTL React 19 site lets guests browse and filter by photographer and phase; deployed live at https://wedding-album.omelcer.workers.dev with zero egress cost.

### Key Accomplishments

1. **Photo acquisition:** gallery-dl-based downloader for 3 Google Photos albums + pic-time gallery with automatic fallback
2. **CLIP pipeline:** ViT-B/32 embeddings for 1327 photos (CPU-only, ~3m20s); 174 film scans without EXIF assigned via KNN to centroids from 1153 EXIF-labeled photos
3. **Full cluster distribution:** 1327 photos across prep/photoshooting/dining/hupa/dancing; metadata.json 398 KB (under 1 MB constraint)
4. **React gallery:** Hebrew RTL masonry grid, shadcn nova design, photographer/phase multi-select filters, lightbox with navigation
5. **Live deployment:** R2 CORS (GET+HEAD, any origin) + Workers Static Assets at https://wedding-album.omelcer.workers.dev — 1309 photos confirmed live by user

### Archive

- Full roadmap: `.planning/milestones/v1.0-ROADMAP.md`
- Requirements: `.planning/milestones/v1.0-REQUIREMENTS.md`
- Phase artifacts: `.planning/milestones/v1.0-phases/`

### Known Deferred Items

- Face recognition: FACE-01..04 deferred to v2 (schema is forward-compatible)
- `site/wrangler.toml` on orphaned branch — cherry-pick c7aa6a2+3b578f6 onto main for full reproducibility
