# Plan 06-02 Summary: Cache-Control Headers in upload.py

**Status:** Complete
**Completed:** 2026-05-17
**Duration:** ~10 minutes
**Commits:** 2 (test + implementation)

## Files Modified

| File | Change | Lines |
|------|--------|-------|
| `pipeline/tests/test_upload.py` | New file with 3 test functions | +64 |
| `pipeline/upload.py` | 3 touch points: helper signature/body + 2 executor.submit calls + metadata.json ExtraArgs | +8, -6 |

## Task Results

### Task 1: Create test_upload.py with failing tests (RED)
Created `pipeline/tests/test_upload.py` with:
- `test_upload_file_passes_extra_args` — verifies ExtraArgs forwarded with CacheControl for photos
- `test_upload_file_no_extra_args_uses_empty_dict` — verifies default `{}` when no extra_args
- `test_upload_file_metadata_cache_control` — verifies 24h CacheControl for metadata.json

RED state confirmed: all 3 tests failed with `TypeError: _upload_file() takes 4 positional arguments but 5 were given`.

### Task 2: Add extra_args plumbing + CacheControl at all 3 upload sites (GREEN)

**Touch point 1** — `_upload_file()` signature (line 91):
```python
def _upload_file(s3, bucket: str, local_path: Path, key: str, extra_args: dict | None = None) -> None:
    s3.upload_file(str(local_path), bucket, key, ExtraArgs=extra_args or {})
```

**Touch point 2** — Photo/thumb executor.submit() (lines 172–185):
Added `{"ContentType": "image/jpeg", "CacheControl": "public, max-age=31536000, immutable"}` as 5th arg to both calls.

**Touch point 3** — metadata.json upload (lines 202–207):
Extended ExtraArgs to `{"ContentType": "application/json", "CacheControl": "public, max-age=86400"}`.

Path-traversal security guard preserved. Docstring preserved verbatim.

## Test Results

```
pipeline/tests/test_upload.py::test_upload_file_passes_extra_args PASSED
pipeline/tests/test_upload.py::test_upload_file_no_extra_args_uses_empty_dict PASSED
pipeline/tests/test_upload.py::test_upload_file_metadata_cache_control PASSED
pipeline/tests/test_resize.py (6 tests) PASSED
pipeline/tests/test_ingest.py (3 tests) PASSED
pipeline/tests/test_cluster.py (4 tests) PASSED
pipeline/tests/test_embed.py (1 test) PASSED

17 passed in 3.93s — no regressions
```

## Grep Verification

- `grep -c '"CacheControl"' pipeline/upload.py` → 3 (photo + thumb + metadata.json)
- `grep -c '"Cache-Control"' pipeline/upload.py` → 0 (hyphenated form absent)
- `grep -c 'ExtraArgs=extra_args or {}' pipeline/upload.py` → 1 (helper body)
- `grep -c 'public, max-age=31536000, immutable' pipeline/upload.py` → 2 (photo + thumb)
- `grep -c 'public, max-age=86400' pipeline/upload.py` → 1 (metadata.json)
- `grep -c '"ContentType": "image/jpeg"' pipeline/upload.py` → 2
- `grep -c '"ContentType": "application/json"' pipeline/upload.py` → 1
- `grep -n 'path-traversal' pipeline/upload.py` → present (security guard intact)

## Requirements Satisfied

- **SEC-02**: metadata.json upload sends `CacheControl: public, max-age=86400` — bounds stale window to 24h
- **SEC-03**: photo/thumb uploads send `CacheControl: public, max-age=31536000, immutable` — 1-year browser/CDN caching
- Phase success criterion 2 (code-side): metadata.json 86400 CacheControl set at upload time
- Phase success criterion 3 (code-side): photo/thumb immutable CacheControl set at upload time
- Backward compatibility: `_upload_file()` with no extra_args still works (passes `{}` to boto3)
- TDD cycle complete: RED (Task 1) → GREEN (Task 2)
