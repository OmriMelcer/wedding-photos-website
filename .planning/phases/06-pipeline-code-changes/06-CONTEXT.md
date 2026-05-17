# Phase 6: Pipeline Code Changes - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Add EXIF stripping to `pipeline/resize.py` and Cache-Control headers to `pipeline/upload.py`. Code-only changes — no pipeline re-run yet (that is Phase 8). Sources in `sources/` are never touched.

</domain>

<decisions>
## Implementation Decisions

### EXIF Stripping (resize.py)

- **D-01:** Strip EXIF explicitly by passing `exif=b""` to both PIL `.save()` calls in `resize_photo()` (web output and thumbnail) — guarantees no EXIF regardless of Pillow version behavior
- **D-02:** `ImageOps.exif_transpose()` still runs first (orientation correction before resize) — then EXIF is stripped at save time
- **D-03:** Only output files are affected (`pipeline/output/photos/`, `pipeline/output/thumbs/`). Files in `sources/` are never opened for writing and must remain byte-for-byte unchanged
- **D-04:** The metadata that matters (photographer, cluster, sort_key, sort_number, timestamp) already lives in `metadata.json` — stripping JPEG EXIF carries no risk of data loss

### Cache-Control Headers (upload.py)

- **D-05:** `_upload_file()` helper gains an `extra_args: dict | None = None` parameter; passes it as `ExtraArgs` to `s3.upload_file()` so Cache-Control flows cleanly through the concurrent upload path
- **D-06:** Photo and thumbnail uploads use `ExtraArgs={"ContentType": "image/jpeg", "CacheControl": "public, max-age=31536000, immutable"}` — immutable because filenames are content-addressed (by photo id)
- **D-07:** metadata.json upload uses `ExtraArgs={"ContentType": "application/json", "CacheControl": "public, max-age=86400"}` — 24 h so guests get fresh metadata after a re-upload within a reasonable window
- **D-08:** ContentType is added to image uploads for consistency (currently unset on photos/thumbs; R2 auto-detects but explicit is cleaner)

### Claude's Discretion

- Exact placement of `extra_args` parameter in `_upload_file` signature
- Whether to add a short inline comment noting the EXIF stripping rationale in `resize_photo()`

</decisions>

<specifics>
## Specific Ideas

- User confirmed: the important metadata (photographer, cluster, sort_key) lives in `metadata.json`, not in JPEG EXIF — stripping is safe and complete
- User confirmed: changes apply only to the output copy of images, never the originals in `sources/`

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §SEC-01, §SEC-02, §SEC-03 — exact acceptance criteria for EXIF stripping and Cache-Control

### Phase success criteria
- `.planning/ROADMAP.md` §Phase 6 — four success criteria including `exiftool` inspection and byte-for-byte sources/ check

### Source files to modify
- `pipeline/resize.py` — current EXIF-transpose + RGB-convert + save pipeline; add `exif=b""` to `.save()` calls
- `pipeline/upload.py` — current `_upload_file` helper and concurrent photo/thumb upload loop; add `extra_args` param and Cache-Control ExtraArgs

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `resize_photo(src, web_out, thumb_out)` in `resize.py:38` — single function to modify; both `.save()` calls are on lines 59 and 62
- `_upload_file(s3, bucket, local_path, key)` in `upload.py:91` — add `extra_args: dict | None = None` param; update the `s3.upload_file()` call on line 96
- Metadata.json upload in `upload.py:200–207` already uses `ExtraArgs={"ContentType": ...}` — extend to add `CacheControl`

### Established Patterns
- One-shot pipeline philosophy: no retry logic in `_upload_file`, exceptions propagate to caller
- `ExtraArgs` pattern already in use for metadata.json upload — same pattern for images
- Path-traversal security guard already present in both `resize.py` and `upload.py` — do not remove

### Integration Points
- Phase 8 re-runs only `resize.py` + `upload.py` — these code changes must be in place before Phase 8 executes
- `pipeline/output/photos/{id}.jpg` and `pipeline/output/thumbs/{id}.jpg` are the output paths — EXIF stripping only applies to files written here

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-pipeline-code-changes*
*Context gathered: 2026-05-17*
