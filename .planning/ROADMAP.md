# Roadmap: Wedding Photo Album

## Milestones

- ✅ **v1.0 MVP** — Phases 1–5 (shipped 2026-05-17)
- [ ] **v1.1 Security & Hardening** — Phases 6–8

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

### v1.1 Security & Hardening

- [x] **Phase 6: Pipeline Code Changes** — Add EXIF stripping and Cache-Control headers to pipeline/resize.py and pipeline/upload.py
- [x] **Phase 7: Cloudflare Hardening** — Configure R2 and Workers budget alerts in Cloudflare dashboard
- [ ] **Phase 8: Re-upload** — Re-run resize + upload stages only to push EXIF-stripped photos with correct cache headers; verify live

## Phase Details

### Phase 6: Pipeline Code Changes
**Goal**: The pipeline produces privacy-safe, CDN-ready outputs — all EXIF stripped from resized images and correct Cache-Control headers set on every R2 object
**Depends on**: Nothing (code-only changes; no pipeline re-run yet)
**Requirements**: SEC-01, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):
  1. Running `pipeline/resize.py` produces output images that contain no GPS coordinates, device identifiers, or timestamps when inspected with `exiftool` or `PIL.Image._getexif()`
  2. Running `pipeline/upload.py` for metadata.json sends `Cache-Control: public, max-age=86400` as object metadata on the R2 upload call
  3. Running `pipeline/upload.py` for photos and thumbnails sends `Cache-Control: public, max-age=31536000, immutable` as object metadata on each R2 upload call
  4. Files in `sources/` are byte-for-byte unchanged after any pipeline run (verified by checksum or `git status`)
**Plans**: 2 plans
Plans:
- [x] 06-01-PLAN.md — EXIF stripping in pipeline/resize.py (SEC-01) with TDD: failing tests then exif=b"" on both .save() calls
- [x] 06-02-PLAN.md — Cache-Control headers in pipeline/upload.py (SEC-02, SEC-03) with TDD: failing tests then extra_args plumbing + CacheControl at all 3 upload sites

### Phase 7: Cloudflare Hardening
**Goal**: The Cloudflare account has spending guardrails so cost attacks are detected before the monthly invoice
**Depends on**: Nothing (Cloudflare dashboard configuration; independent of Phase 6)
**Requirements**: CF-01, CF-02
**Note**: CF-03 (WAF rate limiting) descoped — workers.dev can't use free WAF rate limit rules; Cloudflare's built-in DDoS covers large floods for free
**Success Criteria** (what must be TRUE):
  1. Cloudflare dashboard shows a billing alert configured to notify at $5/month R2 operations spend
  2. Cloudflare dashboard shows a billing alert configured to notify at $5/month Workers requests spend
**Plans**: TBD

### Phase 8: Re-upload
**Goal**: Every photo and thumbnail live on R2 has EXIF stripped and correct Cache-Control headers; cluster assignments and metadata.json content are unchanged
**Depends on**: Phase 6 (code changes must be in place before re-running the pipeline)
**Requirements**: SEC-04
**Success Criteria** (what must be TRUE):
  1. `pipeline/resize.py` and `pipeline/upload.py` complete successfully for all 1327 photos without errors; `pipeline/ingest.py`, `pipeline/embed.py`, and `pipeline/cluster.py` are NOT re-run
  2. Fetching a live R2 photo URL (e.g. via `curl -I`) returns the response header `Cache-Control: public, max-age=31536000, immutable`
  3. Fetching the live `metadata.json` URL returns the response header `Cache-Control: public, max-age=86400`
  4. Inspecting any downloaded R2 photo with `exiftool` shows no GPS, no device ID, and no timestamp fields — confirming EXIF was stripped before upload
**Plans**: TBD

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
| 8. Re-upload | v1.1 | 0/? | Not started | - |
