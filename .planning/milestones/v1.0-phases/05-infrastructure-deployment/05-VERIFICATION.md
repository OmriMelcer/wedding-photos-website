---
phase: 05-infrastructure-deployment
verified: 2026-05-17T15:45:00Z
status: gaps_found
score: 4/6 must-haves verified
overrides_applied: 0
gaps:
  - truth: "site/wrangler.toml exists with Workers Static Assets SPA config"
    status: failed
    reason: "site/wrangler.toml is absent from the working tree and from the main branch. It was created in commits c7aa6a2 and 3b578f6, which are on a divergent branch never merged into main. git log --all confirms the commits exist as objects but are unreachable from HEAD."
    artifacts:
      - path: "site/wrangler.toml"
        issue: "File does not exist on working tree or on main branch"
    missing:
      - "Merge or cherry-pick commits c7aa6a2 and 3b578f6 into main, or re-create site/wrangler.toml with the exact content from those commits"
  - truth: "The production bundle in site/dist/assets contains the real pub-<HASH>.r2.dev URL (VITE_METADATA_URL was baked in)"
    status: failed
    reason: "The local site/dist/assets/index-_mA6K3k1.js bundle (built 2026-05-17T17:16) contains S='/metadata.json' — the fallback path, not the R2 URL. This is the Phase 4 test build, not the production build. The production build (index-BN9FBa02.js, with R2 URL baked in) was produced on the orphaned branch and deployed to Cloudflare, but never landed in the working tree. site/dist is gitignored so it cannot be tracked."
    artifacts:
      - path: "site/dist/assets/index-_mA6K3k1.js"
        issue: "Contains fallback /metadata.json constant S='/metadata.json', not the R2 URL"
      - path: "site/dist/metadata.json"
        issue: "Contains fixture data (fixture_001) not the real 1309-photo metadata.json"
    missing:
      - "Rebuild site with VITE_METADATA_URL=https://pub-db0e5eba70a74d8cbe49b014f6329b9e.r2.dev/metadata.json once wrangler.toml is restored to the working tree"
---

# Phase 5: Infrastructure & Deployment Verification Report

**Phase Goal:** The site is live on Cloudflare Pages, served from R2, accessible to guests at a public URL
**Verified:** 2026-05-17T15:45:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | R2 bucket has CORS configured: GET/HEAD, wildcard origin, maxAgeSeconds 3600 | VERIFIED | cors.json at repo root passes all structural checks; `curl -sI -H "Origin: https://example.com" https://pub-db0e5eba70a74d8cbe49b014f6329b9e.r2.dev/metadata.json` returns `Access-Control-Allow-Origin: *` — CORS is live on the bucket |
| 2  | pipeline/config.yaml r2 block contains real values — no REPLACE_ME tokens | VERIFIED | bucket=wedding-album-noa-omri, endpoint=https://9404ec444cc9fa8171c37f951412fb42.r2.cloudflarestorage.com, r2_public_url=https://pub-db0e5eba70a74d8cbe49b014f6329b9e.r2.dev — all real, no placeholders |
| 3  | site/wrangler.toml exists with Workers Static Assets SPA config | FAILED | File does not exist on the working tree. Created in orphaned commit c7aa6a2 (never merged into main). `find /site -name wrangler.toml` returns empty. |
| 4  | Vite build runs clean with VITE_METADATA_URL baked in; dist/ contains real R2 URL | FAILED | Local site/dist/assets/index-_mA6K3k1.js (built 17:16) contains hardcoded `S='/metadata.json'`. This is the Phase 4 dev build. The production build is on the orphaned branch only. |
| 5  | wrangler deployed site/dist to Cloudflare; public *.workers.dev URL exists | VERIFIED (with caveat) | https://wedding-album.omelcer.workers.dev returns HTTP 200 with Hebrew RTL HTML. The live bundle (index-BN9FBa02.js) contains the real R2 URL. Deploy happened from the orphaned branch — the live Cloudflare state is correct even though it is not reproducible from main. |
| 6  | A guest can open the public URL, see the gallery load, and use all filters | VERIFIED | User-confirmed in Plan 02 Task 4 checkpoint (UAT approved). Live URL confirmed accessible: HTTP 200, Hebrew `lang="he" dir="rtl"` HTML shell served. R2 metadata.json (669 KB, 1309 photos) returns 200 with CORS header. |

**Score:** 4/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `cors.json` | CORS policy body with rules array | VERIFIED | EXISTS, 11 lines, origins=["*"], methods=["GET","HEAD"], maxAgeSeconds=3600 — passes all structural checks |
| `pipeline/config.yaml` (r2 block) | Real bucket/endpoint/public URL | VERIFIED | All three values real; no REPLACE_ME; pub-*.r2.dev URL confirmed live |
| `site/wrangler.toml` | Workers Static Assets SPA config | MISSING | File absent from working tree and main branch. Exists only in orphaned commits c7aa6a2/3b578f6. |
| `site/dist/index.html` | Built site entry point | STUB | Exists (built 17:16) but is the Phase 4 test build — contains `<!doctype html lang="he"` but bundle references `/metadata.json` fallback not R2 URL |
| `site/dist/assets/` (production bundle) | JS bundle with R2 URL baked in | STUB | Exists as index-_mA6K3k1.js but contains `S='/metadata.json'` — fixture build, not production build |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `cors.json` | Cloudflare R2 bucket CORS policy | `wrangler r2 bucket cors set` | WIRED (live) | curl confirms Access-Control-Allow-Origin: * is live on R2 bucket |
| `pipeline/config.yaml r2.r2_public_url` | R2 metadata.json URL | Used by upload.py | WIRED | Value is real; 1309-photo metadata.json confirmed at https://pub-db0e5eba70a74d8cbe49b014f6329b9e.r2.dev/metadata.json (669 KB, HTTP 200) |
| `site/wrangler.toml [assets] directory` | `site/dist` | `wrangler deploy` reads ./dist relative to site/ | NOT_WIRED | wrangler.toml does not exist on working tree or main branch |
| `VITE_METADATA_URL env var` | `site/src/config.js METADATA_URL export` | Vite import.meta.env injection | NOT_WIRED (local build) | Local dist has fallback `/metadata.json` baked in — env var was not set at build time for the local build |
| Deployed *.workers.dev origin | R2 public bucket | Browser fetch with CORS preflight | WIRED (live) | Live site fetches from R2 with CORS; Access-Control-Allow-Origin: * confirmed |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `site/src/App.jsx` (usePhotos hook) | photos state | `fetch(METADATA_URL)` → R2 | LIVE: 1309 photos in R2 metadata.json (669 KB) | FLOWING (live deployment) / HOLLOW_PROP (local dist — fallback URL fails in dev without local file) |

**Note on local vs live state:** The Cloudflare deployment is live and correct. The local working tree `dist/` is a stale Phase 4 test build. Since `dist/` is gitignored, it cannot be committed to the repo. The wiring gap is that the deploy artifacts (wrangler.toml) are missing from main, making the deploy non-reproducible.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| workers.dev URL serves Hebrew HTML | `curl -s -o /dev/null -w "%{http_code}" https://wedding-album.omelcer.workers.dev` | 200 | PASS |
| Live bundle has R2 URL baked in | `curl live bundle \| grep "pub-"` | pub-db0e5eba70a74d8cbe49b014f6329b9e.r2.dev found | PASS |
| R2 metadata.json accessible with CORS | `curl -sI -H "Origin: ..." metadata.json URL` | 200, Access-Control-Allow-Origin: * | PASS |
| Local dist bundle has R2 URL | `grep "pub-" site/dist/assets/index-*.js` | No match — fallback `/metadata.json` found | FAIL |
| site/wrangler.toml exists | `find site/ -name wrangler.toml` | Empty — file not found | FAIL |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| INFRA-01 | 05-01-PLAN.md | R2 bucket CORS + public read access | SATISFIED | cors.json valid; R2 CORS live (Access-Control-Allow-Origin: * confirmed); pipeline/config.yaml has real values |
| INFRA-02 | 05-02-PLAN.md | Vite build + wrangler deploy to Cloudflare | PARTIALLY SATISFIED | Live deployment is up and serving correctly. But wrangler.toml is missing from main and local dist is not the production build — deploy is not reproducible from main branch. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `site/dist/assets/index-_mA6K3k1.js` | embedded | `S='/metadata.json'` (fallback URL as live constant) | Warning | Local dist serves test fixture data, not production photos |
| `site/dist/metadata.json` | 1 | Contains `fixture_001` test data | Warning | Local dist contains fixture, not real wedding photos |

No TBD/FIXME/XXX debt markers found in phase-modified files.

### Human Verification Required

None — the end-to-end human verification was completed in Plan 02 Task 4 (user confirmed "approved" at https://wedding-album.omelcer.workers.dev with 1309 photos, Hebrew RTL, filters working). The gaps are mechanical/reproducibility gaps, not user-experience gaps.

### Gaps Summary

**Two gaps with a shared root cause:** The executor worked on a divergent branch (starting at `050d46b`) and committed `site/wrangler.toml` there (c7aa6a2), then ran the production build and deployed (3b578f6). The docs-only commit (9cd4482) was separately committed to main without merging the implementation branch. Result:

1. **site/wrangler.toml is missing from main** — the deployment config for future re-deploys does not exist in the tracked codebase.
2. **Local dist/assets is a stale Phase 4 test build** — the production bundle (built with VITE_METADATA_URL baked in) exists only on Cloudflare's CDN and on the orphaned branch. Since dist/ is gitignored, this is expected, but it means re-running `npm run build` without VITE_METADATA_URL set will produce a broken local build.

**What IS working correctly:**
- The live site at https://wedding-album.omelcer.workers.dev is fully functional (HTTP 200, 1309 photos, Hebrew RTL, CORS headers present).
- R2 CORS policy is applied and live.
- pipeline/config.yaml has real values for future pipeline re-runs.
- The orphaned branch commits (c7aa6a2, 3b578f6) exist in the git object store and can be recovered via cherry-pick.

**Recommended remediation:**
```bash
# Option A: cherry-pick the two implementation commits onto main
git cherry-pick c7aa6a2 3b578f6

# Option B: recreate site/wrangler.toml manually (8 lines, content known from orphaned commits)
```

---

_Verified: 2026-05-17T15:45:00Z_
_Verifier: Claude (gsd-verifier)_
