# Phase 3: Pipeline Upload - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Write `pipeline/upload.py` — read `pipeline/output/` (photos, thumbs, metadata.json), push all files to Cloudflare R2, and write public URLs back into metadata.json. REQUIREMENTS: UPLD-01, UPLD-02, UPLD-03.

The input artifacts from Phase 2 are ready: 1309 web-quality photos in `pipeline/output/photos/`, 1309 thumbnails in `pipeline/output/thumbs/`, and `pipeline/output/metadata.json` with `r2_url: ''` and `thumb_url: ''` placeholders.

</domain>

<decisions>
## Implementation Decisions

### Public URL format
- **D-01:** Use Cloudflare's free auto-assigned `r2.dev` public URL — no custom domain. Guests never see R2 URLs directly (they're loaded by JS from metadata.json), so the URL doesn't need to be human-readable.
- **D-02:** Base URL read from `config.yaml` as `r2_public_url`. URL pattern: `{r2_public_url}/photos/{id}.jpg` for photos, `{r2_public_url}/thumbs/{id}.jpg` for thumbnails. The `pub-xxx.r2.dev` value is filled in after bucket creation.
- **D-03:** After uploading all files, write constructed URLs back into `pipeline/output/metadata.json` (updating the `r2_url` and `thumb_url` fields), then upload the updated metadata.json to R2.

### Upload behavior
- **D-04:** Always overwrite — upload every file unconditionally, regardless of whether it already exists in R2. Simple and predictable; aligns with the one-shot pipeline philosophy.

### sort_key field
- **D-05:** Keep `sort_key` in the uploaded `metadata.json`. The React gallery will use it to order photos within each cluster, preserving the custom drag-and-drop order set via `apply_custom_order.py`.

### Claude's Discretion
- R2 credentials: use environment variables (not embedded in config.yaml). The `config.yaml` `r2` section holds non-secret config (bucket name, endpoint URL, public URL base); secrets (access key ID, secret access key) come from environment variables `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`. This keeps credentials out of version control.
- Upload concurrency: use `boto3` with concurrent uploads (e.g., `ThreadPoolExecutor`) for speed — 1309 photos × 2 = 2618 file uploads.
- Script structure: follow the established pipeline pattern — `_SCRIPT_DIR / "config.yaml"` for config path, `_PROJECT_ROOT / "pipeline" / "output"` for output paths, `if __name__ == "__main__": main()` entry point.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema and spec
- `wedding_album_spec.md` — Full project spec; metadata.json schema definition (id, filename, r2_url, thumb_url, photographer, timestamp, cluster, cluster_confidence, faces, people); R2 architecture decisions
- `.planning/REQUIREMENTS.md` §UPLD-01, UPLD-02, UPLD-03 — Upload requirements and acceptance criteria

### Existing pipeline patterns
- `pipeline/cluster.py` — Reference for config loading pattern (`pyyaml`, `_CONFIG_PATH`, `_SCRIPT_DIR`), path conventions, and script structure
- `pipeline/resize.py` — Reference for metadata.json read pattern and output directory conventions
- `pipeline/config.yaml` — Current config file; needs a new `r2:` section for bucket name, endpoint URL, and `r2_public_url` (the `pub-xxx.r2.dev` URL assigned by Cloudflare)

### Metadata
- `pipeline/output/metadata.json` — The file to be finalized and uploaded; currently has `r2_url: ''` and `thumb_url: ''` for all 1309 photos; includes `sort_key` field to preserve

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Config loading pattern: `import yaml; config = yaml.safe_load(_CONFIG_PATH.read_text())` — established in `cluster.py` and `embed.py`
- Path conventions: `_SCRIPT_DIR = Path(__file__).resolve().parent; _PROJECT_ROOT = _SCRIPT_DIR.parent` — used across all pipeline scripts
- `boto3` S3-compatible client: standard library for Cloudflare R2 (S3-compatible API). Add as dependency in `pyproject.toml`.

### Established Patterns
- All pipeline scripts use `if __name__ == "__main__": main()` entry point
- Scripts read from `pipeline/output/` and are run via `uv run python pipeline/<script>.py`
- No partial-upload recovery — one-shot; re-run if interrupted
- Security guard pattern (from resize.py): reject filenames with `"/"` or `".."` before constructing upload paths

### Integration Points
- Input: `pipeline/output/metadata.json`, `pipeline/output/photos/*.jpg`, `pipeline/output/thumbs/*.jpg`
- Output: Updated `pipeline/output/metadata.json` (with populated r2_url and thumb_url), all files live on R2
- Config: `pipeline/config.yaml` needs a new `r2:` block (bucket, endpoint, r2_public_url)

</code_context>

<specifics>
## Specific Ideas

- No custom domain — use Cloudflare's free `pub-xxx.r2.dev` URL. Guests visit the Cloudflare Pages URL (`*.pages.dev`), which is also free; R2 URLs are internal to metadata.json and never typed by anyone.
- Credentials via env vars: `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` — consistent with the existing config.yaml comment: "Update R2 credentials in environment variables (see upload.py)".

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-pipeline-upload*
*Context gathered: 2026-05-16*
