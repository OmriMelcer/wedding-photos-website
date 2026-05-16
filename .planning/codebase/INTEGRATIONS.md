# External Integrations

**Analysis Date:** 2026-05-16

## APIs & External Services

**Machine Learning Models:**
- CLIP (ViT-B/32) via `open-clip` or OpenAI `clip`
  - Used for: computing image embeddings for film scans lacking EXIF timestamps
  - Execution: local CPU-only at pipeline run time — no API calls, model weights downloaded once
  - Auth: none (open weights)

**CDN / Edge:**
- Cloudflare CDN — automatic via Cloudflare Pages; no explicit integration code needed

## Data Storage

**File Storage:**
- Cloudflare R2 (S3-compatible object storage)
  - Stores: compressed photo files (`photos/`) and thumbnails (`thumbs/`) and `metadata.json`
  - Connection: R2 endpoint URL + access key/secret (env vars or `pipeline/config.yaml`)
  - Client: `boto3` or AWS CLI (`aws s3 cp`) using `--endpoint-url <R2_ENDPOINT>`
  - Public URL pattern: `https://r2.example.com/photos/<id>.jpg` and `https://r2.example.com/thumbs/<id>.jpg`

**Databases:**
- None — all data lives in `metadata.json`, generated offline and fetched by the browser at runtime

**Caching:**
- None — Cloudflare CDN caches static assets automatically

## Authentication & Identity

**Auth Provider:**
- None — site is fully public, no login required

## Monitoring & Observability

**Error Tracking:**
- Not detected

**Logs:**
- Pipeline: stdout/stderr (local execution only, no persistent log sink)
- Site: browser console only

## CI/CD & Deployment

**Hosting:**
- Cloudflare Pages — static site hosting
  - Deploy command: `wrangler pages deploy dist/`
  - Source: `npm run build` output in `dist/`

**CI Pipeline:**
- Not detected (no `.github/`, no CI config files present)

**Metadata Updates (no redeploy):**
- After re-running the pipeline, `metadata.json` is pushed directly to R2 via AWS CLI:
  ```bash
  aws s3 cp metadata.json s3://r2-bucket/ --endpoint-url <R2_ENDPOINT>
  ```
  The live site picks up the new file on next page load — no Cloudflare Pages redeployment needed.

## Environment Configuration

**Required env vars / config (pipeline):**
- R2 endpoint URL
- R2 bucket name
- R2 access key ID
- R2 secret access key
- Event time windows (EXIF anchoring) — defined in `pipeline/config.yaml`
- Photographer label names — defined in `pipeline/config.yaml`

**Secrets location:**
- Intended to live in `pipeline/config.yaml` (not committed) or shell environment variables
- No `.env` file detected; no secrets management tooling configured yet

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Runtime Data Fetch

**`metadata.json`:**
- The React app fetches `metadata.json` from R2 once on page load
- All filtering (photographer, cluster, future face/person) happens in-memory in the browser
- No subsequent API calls after the initial fetch
- File must stay under 1MB (comfortable at 1200 photos, including future face data)

---

*Integration audit: 2026-05-16*
