# Wedding Photo Album

## What This Is

A static wedding photo album website for ~1000–1200 photos from 3 photographers, built once from an offline Python pipeline and served as a fully static React app. Guests browse and filter photos by photographer and wedding phase. The site is in Hebrew with RTL layout.

## Core Value

Every guest can find and view every photo from the wedding, filtered by who shot it and when it happened — with zero hosting costs and no maintenance burden.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Pipeline downloads photos from 3 Google Photos albums and 1 pic-time gallery automatically
- [ ] Pipeline extracts EXIF timestamps and tags each photo with its photographer (A/B/C)
- [ ] CLIP embeddings (ViT-B/32) computed for all photos; film photos assigned to clusters via KNN
- [ ] Photos assigned to event clusters based on time windows: prep (08:00–14:00), photoshooting (14:00–16:10), dining (16:10–18:00), hupa (18:00–18:40), dancing (18:40–end)
- [ ] Photos resized to web quality; thumbnails generated
- [ ] metadata.json + compressed images uploaded to Cloudflare R2
- [ ] React site fetches metadata.json on load and filters in-memory
- [ ] Masonry gallery with lightbox
- [ ] Filter bar: photographer (A/B/C) and wedding phase — all UI text in Hebrew, RTL layout
- [ ] Phase labels are placeholder English strings for now; will be replaced with Hebrew titles before launch
- [ ] Face filter hidden until Phase 2 (when `people.length === 0`)
- [ ] Site deployed to Cloudflare Pages

### Out of Scope

- Face recognition — Phase 2; schema is forward-compatible, no code changes needed at launch
- Real-time or server-side features — no backend, ever
- Mobile app — web-only
- Incremental pipeline — one-shot; re-run full pipeline if photos change

## Context

- **Photo sources:** 3 Google Photos shared albums (links known) + 1 pic-time gallery (`justsmile.pic-time.com/gallery`, open access). One of the 3 Google Photos albums contains film scans with no EXIF timestamps.
- **Photographers:** 3 total, labeled A/B/C for now. Film photographer is Photographer C — treated identically to others in the UI. Labels will be updated to real names in `pipeline/config.yaml` before launch.
- **Event order is non-standard:** dinner (dining) happens *before* the ceremony (hupa). This is the real schedule — do not reorder.
- **Film scans:** No EXIF. CLIP embeddings compute centroids from EXIF-labeled photos; film photos are assigned to nearest centroid via KNN. `cluster_confidence` scores low-confidence assignments for manual review.
- **Hebrew + RTL:** All displayed text (filter labels, phase names, UI copy) must be in Hebrew with RTL layout. Phase names are English placeholders in config; the React site maps them to Hebrew display strings.
- **Codebase is pre-implementation:** No pipeline scripts or site code exists yet. Repository has a spec (`wedding_album_spec.md`) and codebase map only.

## Constraints

- **No server:** Zero runtime server code. Pipeline runs locally, outputs go to R2, site is static.
- **metadata.json under 1MB:** At 1200 photos this is fine. Do not store raw embeddings in the file.
- **R2 storage:** Do not switch to S3/GCS — egress fees at ~100 guests × ~1200 photos would be non-trivial.
- **CLIP model:** ViT-B/32 via `open-clip`. CPU-only acceptable (~minutes for 1200 photos).
- **1-day build budget:** Pipeline morning, site afternoon.
- **Python 3.13 + uv:** Pinned via `.python-version`. Use `uv run` for all pipeline scripts.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Cloudflare R2 + Pages | Zero egress fees; free static hosting | — Pending |
| CLIP ViT-B/32 KNN for film photos | No EXIF available; CLIP embeddings are open weights, CPU-friendly | — Pending |
| All filtering in-memory in browser | No backend; metadata.json fetched once on load | — Pending |
| Hebrew UI with RTL layout | Wedding guests are Hebrew speakers | — Pending |
| Phase labels as config strings | Allows Hebrew title swap without code changes | — Pending |
| 3 photographers (film = one of them) | Film is a photographer, not a special category | — Pending |
| Download photos before pipeline | Google Photos / pic-time → local folders → pipeline; avoids API complexity if auto-download works | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-16 after initialization*
