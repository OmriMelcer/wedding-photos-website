---
phase: 05-infrastructure-deployment
plan: "02"
subsystem: infrastructure
tags: [wrangler, cloudflare-workers, static-assets, vite, deployment, cors]
dependency_graph:
  requires: [cors-policy-applied, r2-config-real-values]
  provides: [live-public-url, production-bundle-deployed]
  affects: [site/wrangler.toml, site/dist/]
tech_stack:
  added: [wrangler Workers Static Assets]
  patterns: [vite-env-injection, wrangler-static-assets-spa, workers-dev-subdomain]
key_files:
  created:
    - site/wrangler.toml
  modified:
    - site/wrangler.toml (added workers_dev = true in task 3 deviation)
  built:
    - site/dist/ (production bundle with VITE_METADATA_URL baked in)
decisions:
  - "Workers Static Assets path (npx wrangler deploy) used — not the deprecated wrangler pages deploy"
  - "workers_dev = true added to wrangler.toml to suppress wrangler default-enable warning and make workers.dev subdomain explicit"
  - "VITE_METADATA_URL constructed as <r2_public_url>/metadata.json from pipeline/config.yaml r2.r2_public_url at build time"
metrics:
  duration: "~15 min"
  completed: "2026-05-17T15:15:00Z"
  tasks: 4
  files_changed: 2
---

# Phase 5 Plan 2: Workers Static Assets Deploy and Live Verification Summary

Vite production build with `VITE_METADATA_URL=https://pub-db0e5eba70a74d8cbe49b014f6329b9e.r2.dev/metadata.json` baked in; `site/wrangler.toml` created for Workers Static Assets SPA; `npx wrangler deploy` succeeded from `site/`; live site at https://wedding-album.omelcer.workers.dev verified by user — 1309 photos, Hebrew RTL layout, all photographer and phase filters working.

## Tasks Completed

| Task | Type | Commit | Description |
|------|------|--------|-------------|
| Task 1 | auto | c7aa6a2 | Created site/wrangler.toml — Workers Static Assets SPA config (name, compatibility_date, [assets] table) |
| Task 2 | auto | 3b578f6 | Vite production build with VITE_METADATA_URL baked in; pub-* URL confirmed present in dist/assets/ bundle |
| Task 3 | auto | 3b578f6 | npx wrangler deploy from site/ — deployed to https://wedding-album.omelcer.workers.dev |
| Task 4 | checkpoint:human-verify | — | User opened live URL; confirmed 1309 photos, Hebrew RTL, filters working; no CORS errors |

## What Was Built

**site/wrangler.toml** (new file, 8 lines):
```toml
name = "wedding-album"
compatibility_date = "2026-05-17"
workers_dev = true

[assets]
directory = "./dist"
# serves index.html on any unknown path so React Router handles client-side routing
not_found_handling = "single-page-application"
```

Workers Static Assets SPA config. No `[site]` table (deprecated Workers Sites path not used). No `main` field (no Worker handler — pure static asset serving). `workers_dev = true` added explicitly to make the workers.dev subdomain assignment visible in config rather than relying on wrangler implicit default.

**Vite production build (`site/dist/`):**
- `VITE_METADATA_URL` set to `https://pub-db0e5eba70a74d8cbe49b014f6329b9e.r2.dev/metadata.json` at build time
- Value injected via `import.meta.env.VITE_METADATA_URL` in `site/src/config.js` — fallback `/metadata.json` was NOT baked in
- Confirmed: `grep -r "pub-" site/dist/assets/` returned matches; `grep -r '"/metadata.json"' site/dist/assets/` returned zero matches
- `site/dist/index.html` and `site/dist/assets/index-*.js` confirmed present after build

**Live deployment:**
- URL: https://wedding-album.omelcer.workers.dev
- 1309 photos loaded from R2 (`https://pub-db0e5eba70a74d8cbe49b014f6329b9e.r2.dev`)
- CORS verified: `Access-Control-Allow-Origin: *` present on R2 public bucket (confirmed by curl during Task 3)
- Hebrew RTL layout, masonry grid, phase section headers, photographer/phase filter chips all functional

## Decisions Made

1. **Workers Static Assets (`npx wrangler deploy`), not `wrangler pages deploy`**: Locked decision from 05-RESEARCH.md. The Workers Static Assets path is the current Cloudflare recommendation; Pages is the deprecated fallback. Using `wrangler deploy` from `site/` with `[assets]` table in `wrangler.toml`.

2. **`workers_dev = true` added to wrangler.toml**: wrangler emitted a warning on deploy that workers.dev routing was being enabled by default. Added the explicit field so the config is self-documenting and the warning is suppressed on future runs.

3. **VITE_METADATA_URL sourced from pipeline/config.yaml at build time**: Rather than hardcoding the R2 URL in a build script, the executor read `r2.r2_public_url` from `pipeline/config.yaml` (the single source of truth established in Plan 05-01) and appended `/metadata.json`. Consistent with the interfaces contract in the plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Config] Added `workers_dev = true` to site/wrangler.toml**
- **Found during:** Task 3 (deploy)
- **Issue:** wrangler deploy printed a warning that `workers_dev` was not explicitly set; the subdomain was being enabled by implicit default — not a blocker but left the config silently relying on undocumented behavior.
- **Fix:** Added `workers_dev = true` to `site/wrangler.toml` before deploying. One-line change; no other files touched.
- **Files modified:** `site/wrangler.toml`
- **Commit:** 3b578f6 (same commit as build/deploy — the config change + dist/ are one logical deploy unit)

## Known Stubs

None. The production bundle contains the real R2 URL. No placeholder text or fallback paths baked in.

## Threat Flags

No new threat surface beyond the plan's threat model.

- **T-05-05 (Tampering — production bundle):** Mitigated. Workers Static Assets serves immutable hashed bundles. `site/wrangler.toml` contains no secrets.
- **T-05-06 (Information Disclosure — VITE_METADATA_URL in bundle):** Accepted. R2 public URL is intentionally public; baking it into JS exposes nothing beyond what the network tab already reveals.
- **T-05-08 (Spoofing — deployed origin):** Mitigated. Cloudflare provisions `workers.dev` subdomain with TLS by default; no plaintext HTTP path exists.

## Live URL

**https://wedding-album.omelcer.workers.dev**

This URL is the artifact for INFRA-02. Combined with Plan 05-01 (CORS, INFRA-01), all three Phase 5 success criteria from ROADMAP.md are satisfied:
1. R2 CORS configured — `Access-Control-Allow-Origin: *` on GET/HEAD (Plan 05-01)
2. Vite build and wrangler deploy successful (this plan, Tasks 2–3)
3. Guest can open public URL, see gallery, use all filters (this plan, Task 4 — user-verified)

## Self-Check: PASSED

Files confirmed:
- site/wrangler.toml: FOUND (8 lines, contains name = "wedding-album", [assets], not_found_handling, workers_dev)
- .planning/phases/05-infrastructure-deployment/05-02-SUMMARY.md: FOUND (this file)

Commits confirmed:
- c7aa6a2 (chore(05-02): create site/wrangler.toml for Workers Static Assets SPA): FOUND
- 3b578f6 (chore(05-02): add workers_dev=true to wrangler.toml; build and deploy to workers.dev): FOUND

Live verification: User confirmed approved — 1309 photos, Hebrew RTL, filters working, no CORS errors.
INFRA-02 requirement: SATISFIED.
