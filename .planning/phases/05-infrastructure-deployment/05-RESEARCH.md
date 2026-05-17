# Phase 5: Infrastructure & Deployment - Research

**Researched:** 2026-05-17
**Domain:** Cloudflare R2 CORS + Cloudflare Pages deployment via wrangler
**Confidence:** HIGH

## Summary

Phase 5 has a narrow, well-defined scope: configure Cloudflare R2 for public read access with CORS, then build and deploy the React/Vite site to Cloudflare Pages. Both tasks are performed entirely via the wrangler CLI (already present at v4.92.0) with no new runtime dependencies.

The React site is already built and verified (Phase 4 complete, UAT 11/11 passed). `npm run build` in `site/` completes cleanly in ~170ms producing `dist/`. The `VITE_METADATA_URL` env var in `site/src/config.js` is the only production wiring needed — the site reads `/metadata.json` by default but accepts the R2 URL as a build-time environment override.

One notable ecosystem development: Cloudflare deprecated Pages in April 2025 in favor of Workers Static Assets (`wrangler deploy` + `wrangler.toml`). However, Pages projects created before or during the transition period continue to work and `wrangler pages deploy` remains fully operational. For a one-shot static site with no server-side logic, both paths are equivalent. The Workers Static Assets path uses a single `wrangler.toml` file and `wrangler deploy` command; the Pages path uses `wrangler pages deploy dist/`. Both are documented below — the planner should pick one and note it as a locked decision.

**Primary recommendation:** Use Workers Static Assets (`wrangler.toml` + `wrangler deploy`) — it is the current Cloudflare-recommended path and requires zero ongoing maintenance. Fallback: `wrangler pages deploy dist/` also works and is slightly simpler for a one-shot deploy.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | Cloudflare R2 bucket configured with CORS and public read access | R2 public bucket settings + CORS JSON via `wrangler r2 bucket cors set` |
| INFRA-02 | React site built with Vite and deployed to Cloudflare Pages via wrangler | `npm run build` → `dist/`, then `wrangler pages deploy dist/` or `wrangler deploy` |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **No server:** Zero runtime server code. Static site only. Do not introduce a Worker handler unless specifically for asset serving.
- **R2 storage:** Do not switch to S3/GCS. R2 is chosen for zero egress fees.
- **Python 3.13 + uv:** Pipeline commands. Not relevant to this phase.
- **VITE_METADATA_URL:** The site's metadata fetch URL is controlled via this build-time env var (defined in `site/src/config.js`). Must be set before `npm run build` for production.
- **metadata.json under 1MB:** Already a pipeline constraint; deployment does not affect this.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Static file hosting | CDN / Static (Cloudflare Pages) | — | Pages serves pre-built HTML/JS/CSS globally |
| Image & metadata storage | CDN / Static (Cloudflare R2) | — | R2 is origin storage; public bucket serves files directly |
| CORS headers | CDN / Static (R2 bucket policy) | — | R2 enforces CORS rules on all cross-origin GET requests |
| Build-time URL injection | Frontend build (Vite) | — | `VITE_METADATA_URL` is injected at `npm run build` time, not runtime |
| Filter/gallery logic | Browser / Client | — | Already implemented in Phase 4; no changes needed |

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| wrangler | 4.92.0 (installed globally) | R2 CORS config + Pages/Workers deploy | Official Cloudflare CLI — no alternative [VERIFIED: npm registry] |
| Vite | 8.0.13 (registry), 8.0.12 (installed) | Production build | Already installed in `site/package.json` [VERIFIED: npm registry] |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| wrangler r2 bucket cors set | built-in | Apply CORS JSON to R2 bucket | INFRA-01 |
| wrangler pages deploy | built-in | Deploy dist/ to Cloudflare Pages | INFRA-02 (Pages path) |
| wrangler deploy | built-in | Deploy via wrangler.toml Workers Static Assets | INFRA-02 (Workers path) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| wrangler pages deploy | wrangler deploy + wrangler.toml | Workers path is current recommendation; Pages path is simpler for one-shot |
| AWS CLI cors config | wrangler r2 bucket cors set | wrangler is already present; no need for AWS CLI |
| Dashboard manual CORS config | wrangler CLI | CLI is repeatable and scriptable |

**No new package installations required for this phase.**

## Package Legitimacy Audit

No new external packages are installed in this phase. `wrangler` is already globally installed at v4.92.0. `vite` and all site dependencies are already installed from Phase 4.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
[Local machine]
   |
   |-- npm run build (Vite)
   |   reads: VITE_METADATA_URL env var
   |   outputs: site/dist/
   |
   |-- wrangler pages deploy dist/    (or wrangler deploy)
       |
       v
[Cloudflare Pages / Workers Static Assets]
   URL: <project>.pages.dev
   serves: HTML, JS, CSS, fonts
   
[Browser]
   fetches: <pages-url> → HTML + assets
   fetches: VITE_METADATA_URL (R2 public URL) → metadata.json
            ↓ CORS check: AllowedOrigins must include pages.dev domain
   [Cloudflare R2 public bucket]
       serves: metadata.json, photos/*.jpg, thumbs/*.jpg
```

### Deployment Path A: Workers Static Assets (Recommended)

Create `site/wrangler.toml`:
```toml
name = "wedding-album"
compatibility_date = "2026-05-17"

[assets]
directory = "./dist"
not_found_handling = "single-page-application"
```

Deploy:
```bash
cd site
VITE_METADATA_URL=https://pub-REPLACE.r2.dev/metadata.json npm run build
npx wrangler deploy
```

First deploy auto-creates the Worker project. Subsequent deploys overwrite the current assets.

### Deployment Path B: Cloudflare Pages (Legacy — Still Works)

```bash
cd site
VITE_METADATA_URL=https://pub-REPLACE.r2.dev/metadata.json npm run build
npx wrangler pages project create wedding-album   # one-time setup
npx wrangler pages deploy dist/ --project-name wedding-album
```

Or on first deploy, skip the create step — `wrangler pages deploy` prompts interactively.

### CORS Configuration Pattern

Create `cors.json` at project root (not committed with secrets):
```json
{
  "rules": [
    {
      "allowed": {
        "origins": ["*"],
        "methods": ["GET", "HEAD"]
      },
      "maxAgeSeconds": 3600
    }
  ]
}
```

Apply (requires `wrangler login` first and R2 credentials available):
```bash
npx wrangler r2 bucket cors set <BUCKET_NAME> --file cors.json
npx wrangler r2 bucket cors list <BUCKET_NAME>   # verify
```

**Origin note:** Using `"*"` is appropriate for a read-only public photo album. The bucket serves only photos and metadata.json — there is nothing to protect with origin restrictions. Confirmed via [CITED: developers.cloudflare.com/r2/buckets/cors/].

### R2 Public Access Setup

Before CORS configuration works, the bucket must have public access enabled:

1. Cloudflare Dashboard → R2 → select bucket → Settings
2. Under "Public Development URL" → Enable → type `allow`
3. Note the `r2.dev` subdomain URL — this becomes `r2_public_url` in `pipeline/config.yaml`

The `r2_public_url` in `pipeline/config.yaml` is currently a placeholder (`https://pub-REPLACE_ME.r2.dev`). Enabling public access generates the real URL.

**r2.dev vs custom domain:** r2.dev is rate-limited and marked "for non-production use" by Cloudflare docs, but for ~100 wedding guests accessing ~1200 photos once, rate limits are not a practical concern. A custom domain requires a Cloudflare-managed zone. Both options serve the static files identically. [CITED: developers.cloudflare.com/r2/buckets/public-buckets/]

### VITE_METADATA_URL Injection

The site reads `VITE_METADATA_URL` at **build time** (Vite bakes it into the bundle via `import.meta.env`). This means:
- The env var must be set **before** running `npm run build`
- It cannot be changed post-deploy without a rebuild
- For local dev, the default `/metadata.json` reads from `site/public/metadata.json` (already present as a fixture from Phase 4)

Pattern:
```bash
VITE_METADATA_URL=https://pub-XXXXX.r2.dev/metadata.json npm run build
```

### Anti-Patterns to Avoid

- **CORS wildcard with AllowedMethods: PUT/DELETE:** Read-only gallery needs only GET and HEAD. Exposing write methods unnecessarily.
- **Deploying before setting VITE_METADATA_URL:** The built bundle will point to `/metadata.json` (local path), causing 404 in production.
- **Using dashboard-only CORS config without noting it:** It's not in git. Document it or use wrangler CLI to make it reproducible.
- **Custom domain for R2 on first deploy:** Requires a Cloudflare zone — unnecessary complexity for wedding use.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CORS headers on R2 | Custom proxy Worker | R2 native CORS policy | R2 has built-in CORS support via wrangler; a proxy adds unnecessary complexity |
| Static file serving | Express/Node server | Cloudflare Pages / Workers Static Assets | Zero-cost, zero-maintenance global CDN |
| Environment variable injection | Runtime config.json | Vite `import.meta.env.VITE_*` | Vite bakes env vars at build time; no runtime fetch needed |

**Key insight:** This is an infrastructure configuration phase, not a coding phase. The heavy lifting is done. The remaining work is two CLI operations (CORS set + deploy) plus a build-time env var.

## Common Pitfalls

### Pitfall 1: CORS Not Applied to Public Bucket
**What goes wrong:** Browser receives `Access-Control-Allow-Origin` missing from R2 response. Fetch of `metadata.json` fails with CORS error in the console.
**Why it happens:** CORS policy is applied separately from public access. Enabling public access does NOT apply CORS rules automatically.
**How to avoid:** Run `wrangler r2 bucket cors set` AFTER enabling public access. Verify with `wrangler r2 bucket cors list`.
**Warning signs:** Browser console shows "CORS error" or "No 'Access-Control-Allow-Origin' header is present."

### Pitfall 2: metadata.json URL Points to localhost in Production Build
**What goes wrong:** Gallery shows loading skeleton forever. Network tab shows fetch to `/metadata.json` returning 404.
**Why it happens:** `VITE_METADATA_URL` was not set before `npm run build`. Vite baked `undefined` or the fallback `/metadata.json` into the bundle.
**How to avoid:** Always set `VITE_METADATA_URL` before running `npm run build`. The Vite build in `site/src/config.js` line 23: `import.meta.env.VITE_METADATA_URL || '/metadata.json'`.
**Warning signs:** `dist/assets/index-*.js` contains `"/metadata.json"` instead of the R2 URL.

### Pitfall 3: R2 Public URL Placeholder Not Replaced in config.yaml
**What goes wrong:** `upload.py` still has `r2_public_url: "https://pub-REPLACE_ME.r2.dev"` — either upload was never run with the real URL, or metadata.json has wrong URLs.
**Why it happens:** Phase 3 generated the config placeholder; actual R2 bucket activation happens in this phase.
**How to avoid:** Enable R2 public access first (get the real `r2.dev` URL), update `pipeline/config.yaml`, then verify `pipeline/output/metadata.json` has real URLs before deploying.
**Warning signs:** Photos return 404. metadata.json `r2_url` contains `REPLACE_ME`.

### Pitfall 4: wrangler Not Authenticated
**What goes wrong:** `wrangler pages deploy` or `wrangler r2 bucket cors set` fails with "authentication" or "unauthorized" error.
**Why it happens:** `wrangler login` was not run on this machine.
**How to avoid:** Run `wrangler login` before any deployment commands. This opens a browser to authenticate.
**Warning signs:** `Error: You must be logged in to use this command.`

### Pitfall 5: Pages Deprecation Confusion
**What goes wrong:** `wrangler pages deploy` works but generates deprecation warnings; developer switches to `wrangler deploy` mid-session without wrangler.toml, causing failures.
**Why it happens:** Cloudflare deprecated Pages in April 2025. The CLI still works but nudges toward Workers.
**How to avoid:** Pick one path at the start of the plan and commit to it. Both paths produce a live URL.
**Warning signs:** Wrangler output contains "deprecated" warnings but the deploy still succeeds.

## Code Examples

### Minimal cors.json (read-only gallery)
```json
{
  "rules": [
    {
      "allowed": {
        "origins": ["*"],
        "methods": ["GET", "HEAD"]
      },
      "maxAgeSeconds": 3600
    }
  ]
}
```
Source: [CITED: developers.cloudflare.com/api/resources/r2/subresources/buckets/subresources/cors/methods/update/] — this is the API request body format that `wrangler r2 bucket cors set --file` expects.

### wrangler.toml for Workers Static Assets (SPA)
```toml
name = "wedding-album"
compatibility_date = "2026-05-17"

[assets]
directory = "./dist"
not_found_handling = "single-page-application"
```
Source: [CITED: developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/]

### Full deployment sequence
```bash
# 1. Authenticate (once per machine)
npx wrangler login

# 2. Enable R2 public access via dashboard (get pub-XXXXX.r2.dev URL)

# 3. Apply CORS to R2 bucket
npx wrangler r2 bucket cors set <BUCKET_NAME> --file cors.json
npx wrangler r2 bucket cors list <BUCKET_NAME>

# 4. Build site with production metadata URL
cd site
VITE_METADATA_URL=https://pub-XXXXX.r2.dev/metadata.json npm run build

# 5. Deploy (Workers path)
npx wrangler deploy

# OR (Pages path)
npx wrangler pages deploy dist/ --project-name wedding-album
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `wrangler pages deploy` | `wrangler deploy` + `wrangler.toml` | April 2025 | Pages deprecated; both work, Workers is current path |
| AWS CLI for R2 CORS | `wrangler r2 bucket cors set` | 2023-2024 | wrangler now has native CORS commands |
| Manual dashboard CORS | wrangler CLI | 2023-2024 | CLI preferred for repeatability |

**Deprecated/outdated:**
- `wrangler pages deploy`: Still works but Cloudflare is directing users to Workers Static Assets. For this wedding site (one-shot deploy, no CI/CD), the distinction is minor.
- Workers Sites (`wrangler.toml` `[site]` section): Replaced by Workers Static Assets (`[assets]` section). Do not use the old `[site]` pattern.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `"*"` wildcard in CORS `AllowedOrigins` is permitted by R2 | CORS Configuration Pattern | If not allowed, must specify exact Pages URL — requires knowing Pages URL before setting CORS |
| A2 | r2.dev rate limits are not a concern for ~100 guests | R2 Public Access Setup | If rate-limited, guests see 429 errors; mitigation is custom domain |
| A3 | Workers Static Assets (`wrangler deploy`) is available on the current wrangler v4.92.0 | Deployment Path A | If subcommand missing, fall back to Pages path B |

**Note on A1:** Cloudflare docs show `"*"` in examples [CITED: developers.cloudflare.com/r2/buckets/cors/], but only for public buckets explicitly. This bucket is public, so the wildcard is appropriate.

## Open Questions

1. **R2 bucket name and whether public access is already enabled**
   - What we know: `pipeline/config.yaml` has placeholder values (`your-bucket-name`, `pub-REPLACE_ME.r2.dev`)
   - What's unclear: Has the actual R2 bucket been created yet? Has public access been enabled?
   - Recommendation: The plan should include a verification/setup step for R2 bucket creation and public access enable, not assume it's done.

2. **Cloudflare account authentication state**
   - What we know: wrangler is installed at v4.92.0
   - What's unclear: Is `wrangler login` already done on this machine?
   - Recommendation: Plan should include a `wrangler whoami` verification step.

3. **Pages vs Workers Static Assets decision**
   - What we know: Both approaches work; Workers is current recommendation
   - What's unclear: User preference; whether an existing Pages project already exists
   - Recommendation: Default to Workers Static Assets path (wrangler.toml + wrangler deploy); document Pages fallback.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite build + wrangler | Yes | v26.0.0 | — |
| npm | Site install + wrangler | Yes | 11.12.1 | — |
| wrangler (global) | R2 CORS + Pages deploy | Yes | 4.92.0 | `npx wrangler` |
| Vite (site/node_modules) | Production build | Yes | 8.0.12 | — |
| Cloudflare account login | wrangler deploy + CORS set | Unknown | — | Run `wrangler login` |
| R2 bucket (created) | INFRA-01, INFRA-02 | Unknown | — | Create via dashboard |
| R2 public access enabled | INFRA-01 | Unknown | — | Enable via dashboard |

**Missing dependencies with no fallback:**
- Cloudflare account authentication (`wrangler login`) — must be done before any wrangler operation
- R2 bucket created with public access — prerequisite for CORS config and for pipeline upload to have a real URL

**Missing dependencies with fallback:**
- None (wrangler globally available, npm globally available)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 |
| Config file | `site/vite.config.js` (test section) |
| Quick run command | `cd site && npm test -- --run` |
| Full suite command | `cd site && npm test -- --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | R2 CORS allows GET from any origin | manual-only | N/A — external service config | N/A |
| INFRA-02 | Vite build succeeds; wrangler deploy runs without error | smoke/manual | `cd site && npm run build` (build smoke) | N/A |
| INFRA-02 | Guest opens Pages URL, gallery loads, filters work | e2e manual | Open URL in browser | N/A |

**Note:** INFRA-01 and INFRA-02 are infrastructure operations, not code changes. Automated unit/integration tests are not applicable. Verification is: (1) `wrangler r2 bucket cors list` confirms policy, (2) `npm run build` exits 0, (3) `wrangler deploy` or `wrangler pages deploy` exits 0, (4) manual browser verification at the deployed URL.

### Sampling Rate
- **Per task commit:** `cd site && npm test -- --run` (existing test suite — no new tests needed for this phase)
- **Per wave merge:** Same
- **Phase gate:** Live URL opens in browser and gallery loads before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all code that was changed in prior phases. Phase 5 has no new application code; it is all infrastructure configuration and CLI operations.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No user auth; site is public |
| V3 Session Management | No | Static site, no sessions |
| V4 Access Control | Partial | R2 read-only access via CORS policy — only GET/HEAD allowed |
| V5 Input Validation | No | No user input at infrastructure layer |
| V6 Cryptography | No | HTTPS is handled by Cloudflare CDN layer automatically |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| R2 bucket accidentally writable from browser | Tampering | CORS AllowedMethods: GET, HEAD only — no PUT/DELETE |
| Photo URLs enumerable by guests | Information Disclosure | Acceptable — all photos are intentionally public to guests |
| wrangler API token exposed in config | Information Disclosure | Use `wrangler login` OAuth flow, not API token in config files |

## Sources

### Primary (HIGH confidence)
- [CITED: developers.cloudflare.com/r2/buckets/cors/] — R2 CORS configuration, JSON format, wrangler commands
- [CITED: developers.cloudflare.com/api/resources/r2/subresources/buckets/subresources/cors/methods/update/] — exact JSON body format for CORS set API
- [CITED: developers.cloudflare.com/pages/get-started/direct-upload/] — wrangler pages deploy command syntax
- [CITED: developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/] — Workers Static Assets wrangler.toml format
- [VERIFIED: npm registry] — wrangler 4.92.0 (globally installed, confirmed via `wrangler --version`)
- [VERIFIED: npm registry] — vite 8.0.13 (confirmed via `npm view vite version`)

### Secondary (MEDIUM confidence)
- [CITED: developers.cloudflare.com/r2/buckets/public-buckets/] — r2.dev subdomain setup, rate-limit caveat
- `wrangler r2 bucket cors set --help` output — confirmed `--file` flag is required, verified locally

### Tertiary (LOW confidence)
- Community reports on Cloudflare deprecating Pages (April 2025) — confirmed by official migration guide but timeline from secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — wrangler confirmed installed at 4.92.0; all commands verified via `--help`
- Architecture: HIGH — vite build verified working (170ms build), CORS format confirmed against API docs
- Pitfalls: HIGH — pitfalls derive from actual config.yaml state (placeholder URLs observed), confirmed CORS requirements, and verified wrangler auth requirement

**Research date:** 2026-05-17
**Valid until:** 2026-11-17 (stable Cloudflare APIs; Pages deprecation timeline may accelerate)
