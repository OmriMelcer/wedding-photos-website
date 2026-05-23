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

---

## v1.1 Security & Hardening — ✅ SHIPPED 2026-05-18

**Phases:** 6–8 | **Plans:** 4 | **Commits:** 15
**Timeline:** 2026-05-17 → 2026-05-18 (2 days)

### Delivered

Security hardening before sharing the gallery URL with guests: all 1309 photos regenerated with EXIF stripped (GPS + device identifiers removed), re-uploaded to R2 with CDN-ready Cache-Control headers, and Cloudflare spending guardrails configured. The gallery at https://wedding-album.omelcer.workers.dev is now safe to share.

### Key Accomplishments

1. **EXIF stripping:** `exif=b""` on both `.save()` calls in `pipeline/resize.py` — GPS coordinates and device identifiers removed from all live photos; TDD with 6 tests covering web output, thumb output, and source-file integrity
2. **Cache-Control headers:** `max-age=86400` for metadata.json and `max-age=31536000, immutable` for all photos/thumbs — set as S3 ExtraArgs at upload time; TDD with 3 tests; all 17 pipeline tests pass
3. **Cloudflare billing guardrails:** $5/month budget alerts on R2 operations and Workers requests — cost attack protection before invoice
4. **Live re-upload verified:** 1309 photos + 1309 thumbnails regenerated and re-uploaded; live R2 headers confirmed via `curl -I`; metadata.json SHA256 unchanged (cluster assignments intact)
5. **All 17 pipeline tests pass:** 6 resize + 3 upload + 8 pre-existing — no regressions

### Archive

- Full roadmap: `.planning/milestones/v1.1-ROADMAP.md`
- Requirements: `.planning/milestones/v1.1-REQUIREMENTS.md`

### Known Deferred Items

- Face recognition: FACE-01..04 still in v2 scope
- WAF/rate-limiting: CF-03 descoped permanently (free tier limitation on Workers.dev)

---

## v1.2 Downloads & Album Links — ✅ SHIPPED 2026-05-23

**Phases:** 9 | **Plans:** 3 | **Commits:** 18
**Timeline:** 2026-05-23 → 2026-05-23 (1 day)

### Delivered

Download buttons in the gallery (hover overlay on cards and yarl toolbar button in lightbox) and four Hebrew top-bar links to the original source albums. Downloads proxy through a Cloudflare Worker `/api/download` route to bypass R2's cross-origin CORS restriction on the `download` attribute.

### Key Accomplishments

1. **Lightbox download:** yarl Download plugin with per-slide `download: { url, filename }` metadata and Hebrew toolbar label "הורדה"
2. **Gallery card download:** Hover-visible `<a download>` anchor at `bottom-0 end-0` (RTL-safe logical CSS); `stopPropagation` prevents lightbox open
3. **TopBar album links:** 4 Hebrew buttons (אביר סולטן, ענבל זלדין, מגנטים, פילם) above the Filters bar; open in new tab
4. **Worker download proxy:** `/api/download` Worker route fetches from R2 server-side, returns `Content-Disposition: attachment` — bypasses cross-origin download restriction
5. **Config-driven URLs:** `ALBUM_LINKS` export in `site/src/config.js` — update album URLs without touching component code

### Archive

- Full roadmap: `.planning/milestones/v1.2-ROADMAP.md`
- Requirements: `.planning/milestones/v1.2-REQUIREMENTS.md`

### Known Deferred Items

- Face recognition: FACE-01..04 still in v2 scope (schema is forward-compatible)
