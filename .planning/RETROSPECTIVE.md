# Retrospective: Wedding Photo Album

## Milestone: v1.0 — MVP

**Shipped:** 2026-05-17
**Phases:** 5 | **Plans:** 16 | **Timeline:** 2 days (2026-05-16 → 2026-05-17)

### What Was Built

1. `pipeline/acquire_google.py` + `acquire_pictime.py` — gallery-dl-based photo download with requests+BeautifulSoup fallback
2. `pipeline/ingest.py` — EXIF extraction, Israel-time normalization, catalog.json (1327 entries)
3. `pipeline/embed.py` — CLIP ViT-B/32 embeddings for 1327 photos (embeddings.npy, ~3m20s CPU)
4. `pipeline/cluster.py` — time-window assignment for 1153 EXIF photos; KNN assignment for 174 film photos; low_confidence.txt
5. `pipeline/resize.py` — 1327 web photos (≤2000px) + 1327 thumbnails (≤400px), EXIF orientation correction
6. `pipeline/upload.py` — concurrent R2 upload (16 threads); metadata.json 398 KB, uploaded last
7. React 19 site — Hebrew RTL masonry gallery, shadcn nova + Heebo, usePhotos/useFilters hooks, 9 components, lightbox
8. Infrastructure — R2 CORS (GET+HEAD), Workers Static Assets deploy, live at https://wedding-album.omelcer.workers.dev

### What Worked

- **gallery-dl for Google Photos** — worked natively with shared album URLs, no selenium or auth complexity
- **CLIP CPU-only pipeline** — 3m20s for 1327 photos on M-series Mac; well within "minutes" budget from spec
- **One-shot pipeline philosophy** — no retry logic, no partial recovery; made each script simple and predictable
- **Immediate live verification** — user verified live URL in browser at end of Phase 5; no deferred UAT
- **shadcn nova + Heebo** — produced a polished Hebrew RTL gallery in one plan without custom CSS from scratch
- **pipeline/config.yaml as single source of truth** — upload.py and VITE_METADATA_URL both derive from the same file; no drift

### What Was Inefficient

- **REQUIREMENTS.md checkbox tracking** — checkbox states were not updated as Phase 1–3 executed; required a documentation fix at milestone close rather than inline
- **ROADMAP.md progress table** — Phase 2 showed 2/5 in the table despite all 5 summaries existing; tracking gap
- **Orphaned branch incident** — implementation commits (wrangler.toml, production build) landed on a divergent branch that was never merged into main; docs-only commit was pushed to main separately. Result: live deployment non-reproducible from main
- **wrangler.toml missing from main** — requires cherry-pick (c7aa6a2, 3b578f6) as post-milestone cleanup

### Patterns Established

- **gallery-dl as primary + requests+BS4 fallback** — robust photo acquisition without selenium
- **Israel-local-time normalization** — ignore all EXIF offset values; treat as GMT+02:00 unconditionally
- **CLIP KNN cluster assignment** — compute centroids from EXIF-labeled photos first; assign no-EXIF photos to nearest centroid
- **GET+HEAD-only CORS for R2 public buckets** — no AllowedHeaders, no write methods; minimal surface area
- **pipeline/config.yaml as build-time env source** — `VITE_METADATA_URL=$(python3 -c "import yaml; print(c['r2']['r2_public_url'])")`
- **Workers Static Assets wrangler.toml pattern** — `name`, `compatibility_date`, `workers_dev=true`, `[assets]` with `not_found_handling="single-page-application"`
- **VITE_METADATA_URL bake-in verification** — always `grep -r "pub-" site/dist/assets/` after every production build

### Key Lessons

- **Verify merge state before pushing docs commits** — the orphaned-branch incident happened because a docs commit was pushed to main while implementation commits were on a different branch. Always merge or cherry-pick implementation first.
- **wrangler auth check before writing CORS plans** — `npx wrangler whoami` takes 1 second; can downgrade a blocking human-verify gate to an automated task if already authenticated
- **VITE_ env vars are silent fallbacks** — Vite bakes in the fallback `/metadata.json` with exit 0 and no warning if the env var isn't set inline with the build command
- **`dist/` is gitignored — production builds live on CDN only** — future re-verification of the production bundle must use the live deployed URL, not local dist contents

### Cost Observations

- Model mix: predominantly Sonnet 4.6 (main workhorse), Opus for planning phases
- Sessions: 2 days (one build day for pipeline + one for site + infra)
- Notable: entire pipeline + site + deployment in 2 days matches the "1-day build budget" constraint from the spec

---

## Milestone: v1.1 — Security & Hardening

**Shipped:** 2026-05-18
**Phases:** 3 | **Plans:** 4 | **Timeline:** 2 days (2026-05-17 → 2026-05-18)

### What Was Built

1. `pipeline/resize.py` — `exif=b""` added to both `.save()` calls; strips all GPS + device EXIF from resized output; 6 tests
2. `pipeline/upload.py` — `CacheControl` key added to `ExtraArgs` on all 3 upload sites; `_upload_file()` signature extended with `extra_args`; 3 tests
3. Cloudflare dashboard — $5/month billing alerts on R2 operations and Workers requests
4. Re-upload run — 1309 photos + 1309 thumbs regenerated (EXIF stripped) and re-uploaded; live R2 headers verified via `curl -I`

### What Worked

- **TDD with small RED→GREEN cycles** — both Phase 6 plans followed the cycle; tests were written first, implementation followed; no surprises
- **`exif=b""` approach** — simpler than a post-process strip; Pillow-native; no extra dependency
- **Pre-flight verification script** — running `grep -c 'exif=b""'` and `grep -c 'max-age'` before the re-upload confirmed code was correct before committing 1309 uploads
- **metadata.json SHA256 guard** — checking hash before and after resize confirmed cluster assignments were untouched

### What Was Inefficient

- **REQUIREMENTS.md checkbox tracking again** — SEC-01..04 were left unchecked even after Phase 6 and Phase 8 completed; required a fix at milestone close (same pattern as v1.0)
- **Phase 7 had no formal PLAN.md** — Cloudflare dashboard steps are manual and not scriptable; no SUMMARY.md was produced; this is a documentation gap for dashboard-only work
- **Phase 8 SUMMARY.md was not committed** — was untracked at milestone close; required manual staging

### Patterns Established

- **`ExtraArgs` pattern for S3/R2 object metadata** — `{"ContentType": "...", "CacheControl": "..."}` passed as 5th arg to `_upload_file()`; clean, testable, no post-upload patch needed
- **Pre-flight grep checks before destructive pipeline runs** — verify EXIF and CacheControl code is present before running resize + upload on 1000+ photos
- **SHA256 integrity guard on metadata.json** — hash before and after resize/upload to confirm cluster assignments unchanged

### Key Lessons

- **Update REQUIREMENTS.md checkboxes immediately when a plan completes** — carrying stale `[ ]` forward creates confusion at milestone close; set `[x]` in the same commit as the SUMMARY.md
- **Commit phase SUMMARY.md files immediately** — untracked summary files at milestone close are a recurring issue; add to post-plan checklist
- **Manual-only phases (dashboard config) still need a minimal SUMMARY.md** — even a 5-line "what was clicked, what was verified" file is enough; prevents a documentation gap at close

### Cost Observations

- Model mix: Sonnet 4.6 for planning and execution
- Sessions: 2 days for 4 plans
- Notable: all 4 plans were fast (<15 min each); Phase 8 was the longest due to the actual 1309-file pipeline run

---

## Milestone: v1.2 — Downloads & Album Links

**Shipped:** 2026-05-23
**Phases:** 1 | **Plans:** 3 | **Timeline:** 1 day

### What Was Built

1. `site/src/config.js` — `ALBUM_LINKS` export: 4 Hebrew labels + real album URLs
2. `site/src/components/TopBar.jsx` — nav landmark with 4 Button asChild anchor elements; renders above Filters
3. `site/src/components/PhotoCard.jsx` — hover `<a download>` anchor at `bottom-0 end-0` (RTL-safe logical CSS)
4. `site/src/components/Lightbox.jsx` — yarl Download plugin, per-slide `download: { url, filename }`, Hebrew label "הורדה"
5. `site/worker.js` — `/api/download` Worker route: fetches R2 URL server-side, returns `Content-Disposition: attachment`

### What Worked

- **Config-driven album URLs (CONF-01)** — when a URL needed a fix, zero component changes required; single edit in `config.js`
- **Worker download proxy pattern** — cleanly solved the CORS restriction with a minimal 32-line Worker route; no npm dependency
- **Logical CSS for RTL** — `start-0`/`end-0` for card overlay positioning; no `left-`/`right-` classes; RTL contract enforced by tests
- **yarl plugin API** — `plugins` prop array is clean; `download: { url, filename }` object form avoids deprecated string properties

### What Was Inefficient

- **Initial `<a download>` placement** — the cross-origin restriction was discovered at testing, not at design; a note in the plan would have saved one fix commit
- **Placeholder URLs in initial plan** — CONF-01 was correctly deferred to a config-swap, but the initial placeholder `'#'` required a follow-up commit to set real URLs; could have been done in the same plan as the config structure

### Patterns Established

- **Worker `/api/download` proxy** — Worker fetches R2 server-side, sets `Content-Disposition: attachment`, streams back — solves cross-origin `download` attribute restriction for any future download need
- **`ALBUM_LINKS` named export in config.js** — array of `{ label, url }` objects; imported by TopBar only; future album updates require one file edit
- **Button asChild + anchor pattern** — `<Button asChild><a href target="_blank" rel="noopener noreferrer">...</a></Button>` for styled external links in shadcn

### Key Lessons

- **Cross-origin download restriction is a known browser gotcha** — `download` attribute is ignored for cross-origin `href`; always proxy through same-origin endpoint when offering downloads from external storage
- **`alt=""` on decorative images yields role=presentation** — `screen.getByRole('img')` fails; use `container.querySelector('img')` in tests; this is correct accessibility, not a bug
- **Test the full suite after each plan** — 3 plans, each adding tests; running the suite at each merge caught no regressions (42 tests, all green)

### Cost Observations

- Model mix: Sonnet 4.6
- Sessions: 1 day for 3 plans
- Notable: fastest milestone to date — 3 plans, 5 tasks, 1 day; all pure frontend + minimal Worker work

---

## Cross-Milestone Trends

| Metric | v1.0 | v1.1 | v1.2 |
|--------|------|------|------|
| Timeline | 2 days | 2 days | 1 day |
| Phases | 5 | 3 | 1 |
| Plans | 16 | 4 | 3 |
| Files changed | — | 15 | 22 |
| Requirements shipped | 27/27 | 6/6 | 5/5 |
| Test coverage | — | 17 pipeline tests | 42 site tests (all pass) |
| Notable issue | Orphaned branch | REQUIREMENTS.md tracking | Cross-origin download restriction |
