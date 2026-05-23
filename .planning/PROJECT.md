# Wedding Photo Album

## What This Is

A static wedding photo album website for 1327 photos from 3 photographers, built from an offline Python pipeline and served as a fully static React app. An automated pipeline acquires photos from Google Photos and pic-time, computes CLIP embeddings to assign film scans to event clusters, resizes all images, and uploads them to Cloudflare R2. Guests browse and filter by photographer and wedding phase in a Hebrew RTL masonry gallery. The site is live at https://wedding-album.omelcer.workers.dev.

## Core Value

Every guest can find and view every photo from the wedding, filtered by who shot it and when it happened — with zero hosting costs and no maintenance burden.

## Requirements

### Validated

- ✓ Pipeline downloads all photos from 3 Google Photos albums (gallery-dl) — v1.0
- ✓ Pipeline downloads all photos from pic-time gallery (gallery-dl + requests fallback) — v1.0
- ✓ Manual download guide documented for both sources — v1.0
- ✓ EXIF timestamps extracted and normalized to Israel time (GMT+02:00) — v1.0
- ✓ Photographer tag assigned per source folder via config.yaml — v1.0
- ✓ CLIP ViT-B/32 embeddings computed for all 1327 photos (CPU-only, ~3m20s) — v1.0
- ✓ Film photos (174, no EXIF) assigned to clusters via KNN on CLIP centroids — v1.0
- ✓ cluster_confidence scores computed; low-confidence assignments written to low_confidence.txt — v1.0
- ✓ Photos resized to web quality (≤2000px) + thumbnails (≤400px); EXIF orientation corrected — v1.0
- ✓ Compressed photos + thumbnails uploaded to R2 concurrently (ThreadPoolExecutor, 16 workers) — v1.0
- ✓ metadata.json generated (398 KB, 1327 photos) and uploaded to R2 — v1.0
- ✓ pipeline/config.yaml holds all event time windows, photographer names, R2 config, confidence threshold — v1.0
- ✓ metadata.json fetched once on page load; all filtering in-memory — v1.0
- ✓ Responsive masonry grid grouped by phase with Hebrew section headers — v1.0
- ✓ Lightbox with full-resolution image + previous/next navigation through filtered set — v1.0
- ✓ Photographer (multi-select) and phase (multi-select) filter bar with clear-all — v1.0
- ✓ Face filter hidden when people.length === 0 (Phase 2 zero-code-change enablement) — v1.0
- ✓ Hebrew RTL layout; phase keys mapped to Hebrew labels in config — v1.0
- ✓ R2 CORS configured (GET+HEAD, any origin, maxAge 3600) — v1.0
- ✓ Site deployed to Cloudflare Workers Static Assets — v1.0
- ✓ EXIF stripped from all resized output images via `exif=b""` in resize.py — v1.1
- ✓ Cache-Control headers on all R2 objects: `max-age=86400` (metadata.json), `max-age=31536000, immutable` (photos/thumbs) — v1.1
- ✓ Cloudflare billing alerts at $5/month for R2 operations and Workers requests — v1.1
- ✓ All 1309 photos regenerated with EXIF stripped and re-uploaded with correct headers; live R2 verification passed — v1.1
- ✓ Guests can download individual photos from lightbox (yarl Download plugin, Worker proxy for CORS) — v1.2
- ✓ Guests can download photos via hover icon on gallery cards — v1.2
- ✓ Top bar displays 4 Hebrew album link buttons linking to original source albums — v1.2
- ✓ Album URLs stored in `site/src/config.js` — updatable without touching components — v1.2
- ✓ Guests can pinch-to-zoom on lightbox images on mobile (ZOOM-01) — v1.3
- ✓ Guests can scroll-wheel to zoom in/out on lightbox images on desktop (ZOOM-02) — v1.3
- ✓ Guests can drag to pan a zoomed-in lightbox image (ZOOM-03) — v1.3

### Planned (v2)

- [ ] Face recognition pipeline: detect faces, cluster into person identities (FACE-01)
- [ ] User labels face clusters with names (FACE-02)
- [ ] metadata.json updated with `faces[]` and `people[]` arrays — photo ID lists per person, no raw embeddings (FACE-03)
- [ ] Site face filter becomes visible and functional when `people.length > 0` (FACE-04, zero code change on site side)

### Out of Scope

- Backend / server — static-only architecture; no runtime server ever
- Incremental pipeline — one-shot by design; re-run full pipeline if source photos change
- Mobile app — web-first; responsive site covers mobile browsers
- OAuth / login — site is public; no authentication needed for guests
- Real-time updates — no server; updates require re-running the pipeline
- Per-IP WAF rate limiting — Workers.dev can't use free WAF rules; built-in DDoS sufficient for a 100-guest site (descoped in v1.1)
- Worker proxy in front of R2 — requires Workers Paid ($5/month); not cost-effective at this scale
- Private bucket + signed URLs — R2 zero-egress makes financial risk acceptable; defer unless abuse observed

## Context

- **Photo sources:** 3 Google Photos shared albums + 1 pic-time gallery. All downloaded to `sources/`.
- **Photos:** 1327 total. 1153 digital (with EXIF), 174 film scans (no EXIF — Photographer C).
- **Event order:** prep → photoshooting → dining → hupa → dancing. Dinner before ceremony — this is the real schedule.
- **Film scans:** CLIP KNN assignment. 174 film photos assigned to nearest cluster centroid from EXIF-labeled photos. cluster_confidence scores flag low-confidence assignments.
- **Live site:** https://wedding-album.omelcer.workers.dev — 1309 photos live, EXIF stripped, CDN-ready. Safe to share with guests.
- **Codebase:** ~2,750 LOC. Python 3.13 pipeline (uv). React 19 + Vite + Tailwind v4 + shadcn nova. Workers Static Assets deploy via wrangler.
- **metadata.json:** 398 KB (1309 photos). Well under 1 MB constraint. Served from `https://pub-db0e5eba70a74d8cbe49b014f6329b9e.r2.dev`.
- **Security posture (v1.1):** All photos stripped of EXIF before upload. Cache-Control headers set on all R2 objects. Cloudflare billing alerts active. WAF rate-limiting descoped (see Out of Scope).
- **v1.2 additions:** Download proxy via Worker `/api/download` (Content-Disposition: attachment). TopBar with 4 Hebrew album links. Album URLs in `site/src/config.js`. All 42 tests passing.
- **v1.3 additions:** yarl Zoom plugin in lightbox — pinch-to-zoom (mobile), scroll-wheel zoom (desktop), drag-to-pan. Zero new npm dependencies. 53 tests passing.

## Constraints

- **No server:** Zero runtime server code. Pipeline runs locally, outputs go to R2, site is static.
- **metadata.json under 1MB:** Confirmed at 398 KB with 1327 photos. Do not store raw embeddings.
- **R2 storage:** Do not switch to S3/GCS — egress fees at ~100 guests × ~1200 photos would be non-trivial.
- **CLIP model:** ViT-B/32 via `open-clip`. CPU-only acceptable (~3m20s for 1327 photos on M-series Mac).
- **Python 3.13 + uv:** Pinned via `.python-version`. Use `uv run` for all pipeline scripts.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Cloudflare R2 + Workers Static Assets | Zero egress fees; free static hosting | ✓ Good — live at workers.dev, zero cost |
| CLIP ViT-B/32 KNN for film photos | No EXIF available; open weights, CPU-friendly | ✓ Good — 174 film photos assigned successfully |
| All filtering in-memory in browser | No backend; metadata.json fetched once on load | ✓ Good — 398 KB loads instantly |
| Hebrew UI with RTL layout | Wedding guests are Hebrew speakers | ✓ Good — confirmed working in browser |
| Phase labels as config strings | Allows Hebrew title swap without code changes | ✓ Good — PHASE_LABELS in site/src/config.js |
| 3 photographers (film = one of them) | Film is a photographer, not a special category | ✓ Good — clean symmetry in UI |
| gallery-dl for Google Photos | Handles auth natively; no selenium/requests needed | ✓ Good — worked first try |
| ALL camera EXIF offsets → Israel local time | OffsetTimeOriginal unreliable on wedding cameras | ✓ Good — consistent timestamps |
| GET+HEAD only CORS (no AllowedHeaders, no PUT/DELETE) | Threat mitigation; read-only bucket | ✓ Good — T-05-01 mitigated |
| Workers Static Assets (`npx wrangler deploy`) over Pages | Current Cloudflare recommendation; Pages deprecated | ✓ Good — deployed successfully |
| `VITE_METADATA_URL` from `pipeline/config.yaml` at build time | Single source of truth; prevents URL drift | ✓ Good — baked into production bundle |
| shadcn nova preset + Heebo font | Beautiful RTL-friendly UI; Israeli web standard font | ✓ Good — visual checkpoint passed |
| `exif=b""` kwarg on Pillow `.save()` | Explicit EXIF strip at output; orientation correction runs before via `exif_transpose` | ✓ Good — 6 tests pass; backward-compatible across Pillow versions |
| Cache-Control as S3 `ExtraArgs` (`CacheControl` key) | No post-upload metadata patch; headers set atomically at upload time | ✓ Good — verified live on R2 via `curl -I` |
| Descope CF-03 WAF rate limiting | Workers.dev free tier can't use WAF rules; Workers Paid costs $5/month — not justified for a 100-guest site | ✓ Good — Cloudflare DDoS protection covers large floods for free |
| Worker `/api/download` proxy for downloads | Browser `download` attribute silently ignored for cross-origin URLs; Worker adds `Content-Disposition: attachment` | ✓ Good — downloads work from lightbox and gallery cards |
| yarl `download: { url, filename }` object form | Modern API; `downloadUrl`/`downloadFilename` string props are deprecated in yarl v3+ | ✓ Good — TypeScript types confirm; 3 tests pass |
| `ALBUM_LINKS` export in `site/src/config.js` | URLs change; components should not know about specific albums | ✓ Good — URL fix required zero component changes |
| yarl Zoom plugin via sub-path import | Zero new npm packages — Zoom ships inside `yet-another-react-lightbox@^3.32.0` already installed | ✓ Good — zero dependency footprint |
| `maxZoomPixelRatio: 3` mandatory | Default of 1 silently disables zoom on all retina/mobile devices — must override | ✓ Good — zoom works on iPhone and HiDPI displays |
| `pinchZoomV4: true` mandatory | Prevents iOS swipe-block after fast pinch-out; bug fixed in yarl v3.27.0 | ✓ Good — swipe navigation works immediately after pinch-out |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-23 after v1.3 milestone*
