# Phase 5: Infrastructure & Deployment - Pattern Map

**Mapped:** 2026-05-17
**Files analyzed:** 4 (configuration artifacts, not application code)
**Analogs found:** 3 / 4

## Context Note

Phase 5 contains no new application code. Every deliverable is a configuration artifact or a CLI operation. "Pattern" here means: what exact structure, field names, and values should each artifact use, derived from the real codebase state today.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `cors.json` (project root) | config | request-response | RESEARCH.md §CORS Configuration Pattern | research-only (no codebase analog exists) |
| `site/wrangler.toml` | config | — | `pyproject.toml` (TOML structure reference) | partial (same format family, different tool) |
| `pipeline/config.yaml` (edit) | config | — | `pipeline/config.yaml` itself (placeholder lines to fill) | self-analog (in-place edit) |
| `site/src/config.js` (read-only verify) | config/utility | — | `site/src/config.js` (already correct) | exact (no change needed) |

---

## Pattern Assignments

### `cors.json` (project root — new file)

**Analog:** RESEARCH.md §Code Examples (no codebase analog exists — first infrastructure config file in this repo)

**Exact structure to use** (from RESEARCH.md line 233-246, confirmed against Cloudflare API docs):
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

**Rationale for each field:**
- `origins: ["*"]` — public read-only gallery; no credentials or write methods exposed; wildcard confirmed acceptable for public R2 buckets
- `methods: ["GET", "HEAD"]` — read-only; do NOT add PUT/DELETE (anti-pattern per RESEARCH.md §Anti-Patterns)
- `maxAgeSeconds: 3600` — 1-hour preflight cache; appropriate for a static, unchanging asset bucket

**Apply via:**
```bash
npx wrangler r2 bucket cors set <BUCKET_NAME> --file cors.json
npx wrangler r2 bucket cors list <BUCKET_NAME>   # verify
```

**Note:** `cors.json` does NOT need to be committed — it contains no secrets but is a one-shot config file. If committed, add it to the repo root (not inside `site/` or `pipeline/`) for discoverability.

---

### `site/wrangler.toml` (new file — Workers Static Assets path)

**Analog:** `pyproject.toml` for TOML format reference; RESEARCH.md §wrangler.toml for Workers Static Assets

**No existing wrangler.toml anywhere in the repo** — `find` returned no results. This is the first one.

**Exact structure to use** (from RESEARCH.md lines 250-257, Workers Static Assets SPA pattern):
```toml
name = "wedding-album"
compatibility_date = "2026-05-17"

[assets]
directory = "./dist"
not_found_handling = "single-page-application"
```

**Field decisions:**
- `name` — must match the Cloudflare Worker/Pages project name; `"wedding-album"` is consistent with the project name used throughout planning
- `compatibility_date` — today's date (2026-05-17); Cloudflare freezes API behavior at this date for the worker
- `[assets] directory = "./dist"` — Vite outputs to `site/dist/`; `wrangler.toml` lives in `site/` so `./dist` is correct
- `not_found_handling = "single-page-application"` — required for React Router; serves `index.html` for unknown paths (this app has no routes beyond `/` but is still correct practice)

**Location:** `site/wrangler.toml` (not repo root — `wrangler deploy` must be run from `site/`)

**Apply via (from `site/` directory):**
```bash
npx wrangler deploy
```

---

### `pipeline/config.yaml` (in-place edit — placeholder values only)

**Analog:** `pipeline/config.yaml` itself — all structure and non-placeholder fields are already correct. Only the `r2:` section placeholders need replacing.

**Current placeholder lines** (`pipeline/config.yaml` lines 71-74):
```yaml
r2:
  bucket: "your-bucket-name"
  endpoint: "https://ACCOUNT_ID.r2.cloudflarestorage.com"
  r2_public_url: "https://pub-REPLACE_ME.r2.dev"
```

**Pattern for replacement** (fill in real values after enabling R2 public access in the Cloudflare dashboard):
```yaml
r2:
  bucket: "<real-bucket-name>"
  endpoint: "https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
  r2_public_url: "https://pub-<HASH>.r2.dev"
```

**How `upload.py` consumes these fields** (`pipeline/upload.py` lines 129-130):
```python
bucket = config["r2"]["bucket"]
r2_public_url = config["r2"]["r2_public_url"].rstrip("/")
```

And line 158-159:
```python
photo["r2_url"]    = f"{r2_public_url}/photos/{photo['id']}.jpg"
photo["thumb_url"] = f"{r2_public_url}/thumbs/{photo['id']}.jpg"
```

**This means:** `r2_public_url` is used as a URL prefix. The `r2.dev` URL from the Cloudflare dashboard (e.g., `https://pub-abc123.r2.dev`) goes here verbatim — `upload.py` strips any trailing slash already.

**All other fields in `config.yaml` are correct and must not be changed in this phase.**

---

### `site/src/config.js` (verify only — no changes needed)

**Analog:** `site/src/config.js` itself — already correctly implements `VITE_METADATA_URL` injection.

**Relevant line** (`site/src/config.js` line 23):
```js
export const METADATA_URL = import.meta.env.VITE_METADATA_URL || '/metadata.json';
```

**This is already production-ready.** No code change is needed. The env var is injected at build time:
```bash
VITE_METADATA_URL=https://pub-<HASH>.r2.dev/metadata.json npm run build
```

**Verification step:** After build, grep the bundle to confirm the real URL was baked in:
```bash
grep -r "pub-" site/dist/assets/
```

If `pub-` is absent and `/metadata.json` appears instead, `VITE_METADATA_URL` was not set before the build.

---

## Shared Patterns

### R2 Credentials — Never in Config Files

**Source:** `pipeline/upload.py` lines 58-68, `pipeline/config.yaml` lines 69-70

**Pattern:** R2 write credentials (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) are always passed as environment variables, never stored in `config.yaml` or any committed file. `config.yaml` holds only non-secret R2 config (bucket name, endpoint, public URL).

Apply to: Any step that calls `upload.py` or `wrangler r2` commands.

```python
# From upload.py — the established pattern for credential access
access_key = os.environ.get("R2_ACCESS_KEY_ID")
secret_key = os.environ.get("R2_SECRET_ACCESS_KEY")
```

```bash
# For wrangler — use OAuth login, not API token in config
npx wrangler login   # opens browser OAuth flow once per machine
```

### TOML File Structure

**Source:** `pyproject.toml` (only existing TOML in the repo)

The project uses flat-section TOML without complex nesting. `wrangler.toml` follows the same convention: top-level scalar fields first, then one `[assets]` table. No arrays of tables, no inline tables.

### Config YAML Structure

**Source:** `pipeline/config.yaml` lines 1-8 (header comment block)

All config YAML files in this project use a header comment block explaining purpose, usage notes, and what must be configured before running. The `wrangler.toml` is a TOML file (not YAML) but should carry a brief inline comment explaining the `not_found_handling` field, following the project's pattern of documenting non-obvious behavior inline.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `cors.json` | config | — | No CORS or infrastructure config files exist yet in this repo; structure comes from Cloudflare API docs (RESEARCH.md §Code Examples) |

---

## Deployment Operation Sequence

This is reproduced here so the planner can embed it directly into plan actions. It captures all ordering dependencies.

```bash
# Step 1: Verify wrangler auth (prerequisite for all wrangler operations)
npx wrangler whoami

# Step 2: Enable R2 public access via Cloudflare dashboard (manual)
#   → Dashboard → R2 → <bucket> → Settings → Public Development URL → Enable
#   → Copy the pub-XXXXX.r2.dev URL

# Step 3: Update pipeline/config.yaml r2 section with real values

# Step 4: Apply CORS to R2 bucket
npx wrangler r2 bucket cors set <BUCKET_NAME> --file cors.json
npx wrangler r2 bucket cors list <BUCKET_NAME>   # verify

# Step 5: Build site with production metadata URL
cd site
VITE_METADATA_URL=https://pub-XXXXX.r2.dev/metadata.json npm run build

# Step 6: Verify URL was baked in
grep -r "pub-" dist/assets/

# Step 7: Deploy (Workers Static Assets path — recommended)
npx wrangler deploy

# Step 8: Open the deployed URL in browser and verify gallery loads
```

---

## Metadata

**Analog search scope:** `/Users/omrimelcer/dev/wedding-photos-website` (full repo, excluding node_modules and __pycache__)
**Files scanned:** `pipeline/config.yaml`, `pipeline/upload.py`, `site/src/config.js`, `site/vite.config.js`, `site/package.json`, `site/index.html`, `pyproject.toml`
**Existing wrangler.toml:** None found — first infrastructure deploy for this project
**Pattern extraction date:** 2026-05-17
