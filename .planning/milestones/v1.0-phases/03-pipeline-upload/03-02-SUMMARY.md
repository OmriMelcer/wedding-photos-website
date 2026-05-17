---
plan: 03-02
phase: 03-pipeline-upload
status: complete
---

# Plan 03-02 Summary

## What Was Done
- Created `pipeline/upload.py` — the final pipeline stage
- Reads R2 config (bucket, endpoint, r2_public_url) from `pipeline/config.yaml`
- Reads R2 credentials from env vars R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY
- Mutates r2_url and thumb_url in pipeline/output/metadata.json before uploading
- Uploads photos + thumbs concurrently via ThreadPoolExecutor(max_workers=16)
- Uploads metadata.json last with ContentType: application/json
- Path-traversal guard rejects filenames containing / or ..
- sort_key and all other metadata fields preserved through the round-trip

## Verification Passed
- File parses as valid Python ✓
- All acceptance criteria checks pass ✓
- Exits non-zero with readable error if env vars or metadata.json missing ✓

## Key Decisions
- URL construction uses `photo["id"]` (not `photo["filename"]`) because resize.py writes output as `{id}.jpg`
- `r2_public_url` is rstrip'd of trailing slashes before interpolation to avoid double-slash in URLs
- Exceptions from `future.result()` propagate — no silent failure swallowing (one-shot philosophy)
- Photos that fail the security guard are excluded from uploads but the rest continue
