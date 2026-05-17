---
phase: 05-infrastructure-deployment
plan: "01"
subsystem: infrastructure
tags: [r2, cors, cloudflare, wrangler, config]
dependency_graph:
  requires: []
  provides: [cors-policy-applied, r2-config-real-values]
  affects: [pipeline/upload.py, site/src/App.jsx (via VITE_METADATA_URL in plan 05-02)]
tech_stack:
  added: []
  patterns: [wrangler-r2-cors-set, read-only-cors-policy]
key_files:
  created:
    - cors.json
  modified:
    - pipeline/config.yaml
decisions:
  - "Used GET+HEAD only CORS policy (no AllowedHeaders, no PUT/POST/DELETE) per T-05-01 threat mitigation"
  - "cors.json at repo root so wrangler r2 bucket cors set can be re-run without arguments change"
  - "R2 public URL (pub-*.r2.dev) stored in pipeline/config.yaml r2.r2_public_url so upload.py generates canonical photo URLs for Plan 05-02 VITE_METADATA_URL"
metrics:
  duration: "~10 min"
  completed: "2026-05-17T14:55:18Z"
  tasks: 3
  files_changed: 2
---

# Phase 5 Plan 1: R2 Public Access and CORS Configuration Summary

Cloudflare R2 bucket `wedding-album-noa-omri` configured with read-only CORS policy (GET+HEAD, any origin, maxAge 3600) via `cors.json` applied through `npx wrangler r2 bucket cors set`; `pipeline/config.yaml` r2 block updated with real bucket name, account endpoint, and pub-*.r2.dev URL — no REPLACE_ME tokens remain.

## Tasks Completed

| Task | Type | Commit | Description |
|------|------|--------|-------------|
| Task 1 | checkpoint:human-action | — | User provided bucket name, endpoint URL, and public URL; wrangler already authenticated (omelcer@gmail.com) |
| Task 2 | auto | b7651c6 | cors.json created; pipeline/config.yaml r2 placeholders replaced with real values |
| Task 3 | checkpoint:human-verify | — (wrangler automated) | CORS applied via `npx wrangler r2 bucket cors set`; verified with `cors list` — all 5 acceptance criteria passed |

## What Was Built

**cors.json** (repo root): CORS policy with one rule: origins `["*"]`, methods `["GET", "HEAD"]`, `maxAgeSeconds: 3600`. No AllowedHeaders, no PUT/POST/DELETE. Format matches Cloudflare API `"rules"` shape verified in 05-RESEARCH.md.

**pipeline/config.yaml r2 block** (lines 71–74 only changed):
- `r2.bucket`: `wedding-album-noa-omri`
- `r2.endpoint`: `https://9404ec444cc9fa8171c37f951412fb42.r2.cloudflarestorage.com`
- `r2.r2_public_url`: `https://pub-db0e5eba70a74d8cbe49b014f6329b9e.r2.dev`

**Live CORS policy** (confirmed via `npx wrangler r2 bucket cors list`):
```
allowed_origins:  *
allowed_methods:  GET, HEAD
allowed_headers:  (no headers)
exposed_headers:  (no exposed headers)
max_age_seconds:  3600
```

## Decisions Made

1. **GET+HEAD only, no AllowedHeaders**: Implements T-05-01 mitigation. No PUT/DELETE exposed cross-origin. AllowedHeaders omitted — unnecessary for simple reads and omission reduces surface area.
2. **cors.json at repo root**: Makes the wrangler command reproducible without specifying a path. Follows 05-PATTERNS.md convention.
3. **config.yaml edit scoped to r2 block only**: Comments, sources, photographers, pipeline sections unchanged. Preserves 2-space YAML indentation throughout.

## Deviations from Plan

None — plan executed exactly as written. Task 3 note: the plan stated the agent MAY run wrangler commands directly if authenticated. Wrangler was confirmed authenticated (`npx wrangler whoami` showed omelcer@gmail.com, account 9404ec444cc9fa8171c37f951412fb42), so Task 3 was automated without a human-verify pause.

## Known Stubs

None. pipeline/config.yaml r2 block contains no placeholder values. cors.json contains no TODO items.

## Threat Flags

No new threat surface beyond the plan's threat model. The applied CORS policy was verified to contain only GET+HEAD — T-05-01 (write method exposure) is mitigated. T-05-03 (credentials in config) is maintained: only public values (bucket name, endpoint, public URL) are in config.yaml; R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY remain as env vars.

## Self-Check: PASSED

Files confirmed:
- cors.json: FOUND
- pipeline/config.yaml: FOUND (r2 block updated, no REPLACE_ME tokens)

Commits confirmed:
- b7651c6 (chore(05-01): write cors.json and replace r2 placeholders in config.yaml): FOUND

Live CORS policy confirmed: `npx wrangler r2 bucket cors list wedding-album-noa-omri` returned GET, HEAD, *, 3600 — no PUT/DELETE.
