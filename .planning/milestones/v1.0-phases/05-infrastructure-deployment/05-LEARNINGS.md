---
phase: 5
phase_name: "Infrastructure & Deployment"
project: "Wedding Photo Album"
generated: "2026-05-17T00:00:00Z"
counts:
  decisions: 6
  lessons: 4
  patterns: 4
  surprises: 3
missing_artifacts:
  - "05-UAT.md"
---

# Phase 5 Learnings: Infrastructure & Deployment

## Decisions

### GET+HEAD-only CORS policy with no AllowedHeaders
CORS policy restricted to `methods: ["GET", "HEAD"]` with no `AllowedHeaders` field. No PUT/POST/DELETE exposed cross-origin.

**Rationale:** Implements T-05-01 threat mitigation — a public read-only album has no need for write methods cross-origin. Omitting AllowedHeaders reduces CORS complexity for simple GETs and shrinks the attack surface to exactly what the use case requires.
**Source:** 05-01-PLAN.md, 05-01-SUMMARY.md

---

### cors.json placed at repo root
The CORS policy body file written at the repo root rather than inside `pipeline/` or `site/`.

**Rationale:** Makes the `wrangler r2 bucket cors set <BUCKET_NAME> --file cors.json` command reproducible without specifying a `--file` path. Keeps the command portable across machines.
**Source:** 05-01-SUMMARY.md

---

### R2 public URL as single source of truth in pipeline/config.yaml
`pipeline/config.yaml r2.r2_public_url` is the canonical value consumed by both `upload.py` (to generate `r2_url` / `thumb_url` in metadata.json) and the Vite build (via `VITE_METADATA_URL`).

**Rationale:** A single file prevents the deployed site URL and the metadata URLs from drifting out of sync if the bucket is ever renamed or the endpoint changes.
**Source:** 05-01-PLAN.md, 05-01-SUMMARY.md, 05-02-SUMMARY.md

---

### Workers Static Assets (npx wrangler deploy) over wrangler pages deploy
Deployed using `npx wrangler deploy` with a `[assets]` table in `site/wrangler.toml` — the Workers Static Assets path.

**Rationale:** Workers Static Assets is the current Cloudflare recommendation for SPA hosting. `wrangler pages deploy` is the deprecated fallback and would create a different (Pages) project type that Cloudflare is migrating away from.
**Source:** 05-02-PLAN.md, 05-02-SUMMARY.md

---

### workers_dev = true added explicitly to wrangler.toml
`workers_dev = true` field added to `site/wrangler.toml` as an explicit declaration.

**Rationale:** wrangler emitted a warning that workers.dev routing was being enabled implicitly. Making it explicit suppresses the warning on future deploys and makes the config self-documenting — the subdomain assignment is visible in the file rather than relying on undocumented wrangler defaults.
**Source:** 05-02-SUMMARY.md

---

### VITE_METADATA_URL derived from pipeline/config.yaml at Vite build time
The metadata URL passed to `npm run build` is constructed at build time by reading `r2.r2_public_url` from `pipeline/config.yaml` and appending `/metadata.json`.

**Rationale:** Avoids hardcoding the R2 URL in a separate build script or environment file. pipeline/config.yaml is already the authoritative source (used by upload.py), so deriving VITE_METADATA_URL from it keeps all R2 references in one place.
**Source:** 05-02-PLAN.md, 05-02-SUMMARY.md

---

## Lessons

### Orphaned branch commits leave live deployments non-reproducible
The executor committed `site/wrangler.toml` and the production Vite build on a divergent branch (starting at `050d46b`). The docs-only commit (`9cd4482`) was pushed to main separately without merging the implementation branch. The live deployment worked correctly, but the config file (`site/wrangler.toml`) was absent from main and the deploy became non-reproducible from the main branch.

**Context:** VERIFICATION.md identified this as the shared root cause of 2 of 6 verification gaps. The live site at https://wedding-album.omelcer.workers.dev functioned correctly throughout; the gap was purely a reproducibility/branch hygiene issue. Remediation: cherry-pick commits c7aa6a2 and 3b578f6 onto main, or recreate `site/wrangler.toml` (8 lines, content known).
**Source:** 05-VERIFICATION.md

---

### VITE_METADATA_URL must be set inline with npm run build or Vite silently bakes in the fallback
If `VITE_METADATA_URL` is not exported in the same shell invocation as `npm run build`, Vite injects the fallback constant `'/metadata.json'` into the bundle instead of the R2 URL. The build succeeds with exit code 0 — there is no warning.

**Context:** Confirmed in VERIFICATION.md: the local `site/dist/assets/index-_mA6K3k1.js` (a Phase 4 test build) contained `S='/metadata.json'` because the env var was not set at the time of that build. Verify the bake-in after every production build with: `grep -r "pub-" site/dist/assets/`.
**Source:** 05-VERIFICATION.md, 05-02-PLAN.md

---

### wrangler login can be skipped if a prior session is already authenticated
Plan 05-01 Task 1 was designed as a blocking human-action checkpoint that included running `wrangler login`. In practice, wrangler was already authenticated from a prior session (`npx wrangler whoami` returned omelcer@gmail.com). Task 3 (apply CORS) was then automated without a human-verify pause.

**Context:** The checkpoint design was still correct as a defensive measure; the auth check is cheap. But plans can be faster to execute when the operator's wrangler session is still active. Worth checking `npx wrangler whoami` before assuming login is required.
**Source:** 05-01-SUMMARY.md

---

### site/dist is gitignored — production builds exist only on Cloudflare CDN and local machines
Because `site/dist/` is gitignored, the production bundle (built with `VITE_METADATA_URL` baked in) cannot be committed to the repo. After the orphaned-branch incident, the live CDN had the correct bundle while the working-tree dist was a stale Phase 4 fixture build. Future verification of the production bundle must use the live deployed URL, not local dist contents.

**Context:** VERIFICATION.md noted that `site/dist/assets/index-_mA6K3k1.js` contained fixture data (`fixture_001`) and the fallback URL. The working-tree dist is not a reliable verification target for production correctness.
**Source:** 05-VERIFICATION.md

---

## Patterns

### Single source of truth: pipeline/config.yaml for all R2 connection values
Store bucket name, S3 endpoint, and public URL in `pipeline/config.yaml r2.*`. Both the pipeline (`upload.py`) and the site build (via `VITE_METADATA_URL=$(python3 -c "import yaml; ..."`) read from this one file.

**When to use:** Whenever a config value is consumed by both the offline pipeline and the frontend build. Prevents URL drift between metadata.json (generated by pipeline) and the site bundle (deployed separately).
**Source:** 05-01-PLAN.md, 05-02-SUMMARY.md

---

### Read-only CORS policy for public asset buckets
```json
{
  "rules": [{
    "allowed": { "origins": ["*"], "methods": ["GET", "HEAD"] },
    "maxAgeSeconds": 3600
  }]
}
```
No `AllowedHeaders`, no `ExposeHeaders`, no PUT/DELETE. Store in `cors.json` at repo root.

**When to use:** Any R2 or S3-compatible bucket intended for browser-readable public assets only. The absence of `AllowedHeaders` is intentional — simple cross-origin GETs do not need preflight header negotiation.
**Source:** 05-01-PLAN.md, 05-01-SUMMARY.md

---

### Workers Static Assets SPA wrangler.toml template
```toml
name = "wedding-album"
compatibility_date = "2026-05-17"
workers_dev = true

[assets]
directory = "./dist"
# serves index.html on any unknown path so React Router handles client-side routing
not_found_handling = "single-page-application"
```
Place at `site/wrangler.toml` (not repo root). No `[site]` table, no `main` field.

**When to use:** Deploying a Vite/React SPA to Cloudflare Workers Static Assets. `single-page-application` not_found_handling is required for React Router deep links to work on the deployed URL. `workers_dev = true` makes subdomain assignment explicit and suppresses wrangler's implicit-default warning.
**Source:** 05-02-PLAN.md, 05-02-SUMMARY.md

---

### Inline VITE_METADATA_URL injection at build time
```bash
METADATA_URL=$(python3 -c "import yaml; c=yaml.safe_load(open('../pipeline/config.yaml')); print(c['r2']['r2_public_url'].rstrip('/') + '/metadata.json')")
cd site && VITE_METADATA_URL="$METADATA_URL" npm run build
# Verify bake-in:
grep -rq "pub-" site/dist/assets/ && echo "OK" || echo "FALLBACK BAKED IN"
```

**When to use:** Every production Vite build for this project. Never run `npm run build` without setting `VITE_METADATA_URL` — Vite silently falls back to `/metadata.json` with no warning, and the build exit code is still 0. Always verify with the grep after the build.
**Source:** 05-02-PLAN.md, 05-02-SUMMARY.md, 05-VERIFICATION.md

---

## Surprises

### wrangler emitted implicit workers_dev warning at deploy time
`npx wrangler deploy` printed a warning that `workers_dev` routing was being enabled by default even though it was not declared in `wrangler.toml`. The deploy succeeded, but the config was silently relying on undocumented default behavior.

**Impact:** Minor. Required adding one line (`workers_dev = true`) to `site/wrangler.toml` as an unplanned deviation. No functional impact. Revealed that wrangler defaults can produce surprising config behavior that surfaces only at first deploy, not during authoring.
**Source:** 05-02-SUMMARY.md

---

### Implementation commits landed on an orphaned branch, leaving main non-reproducible
The executor worked on a divergent branch and committed `site/wrangler.toml` (c7aa6a2) and the production build/deploy (3b578f6) there. A separate docs-only commit (9cd4482) was pushed to main without merging the implementation branch. This meant the live Cloudflare deployment was correct and fully functional, but the deployment config (`site/wrangler.toml`) was not present in main.

**Impact:** Medium. Caused 2 of 6 verification gaps (INFRA-02 partially satisfied). The site continued to work without interruption; the gap was purely reproducibility. Remediation required cherry-picking two commits or manually recreating an 8-line file. A merge-before-docs discipline would prevent recurrence.
**Source:** 05-VERIFICATION.md

---

### Task 3 human-verify checkpoint was unnecessary — wrangler was already authenticated
Plan 05-01 Task 3 was a `checkpoint:human-verify` gate for applying CORS via wrangler. Because wrangler was already authenticated from a prior session, the agent was able to run the `cors set` / `cors list` commands directly and treat the list output as the acceptance-criteria check, skipping the human pause entirely.

**Impact:** Minor positive — faster plan execution. The checkpoint design was still correct defensively. For future plans with wrangler operations, a `npx wrangler whoami` check before writing the plan can determine whether a human-action gate is actually needed.
**Source:** 05-01-SUMMARY.md
