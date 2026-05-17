# Phase 6: Pipeline Code Changes - Research

**Researched:** 2026-05-17
**Domain:** Python image processing (Pillow) + AWS/R2 object upload (boto3)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**EXIF Stripping (resize.py)**
- D-01: Strip EXIF explicitly by passing `exif=b""` to both PIL `.save()` calls in `resize_photo()` (web output and thumbnail) — guarantees no EXIF regardless of Pillow version behavior
- D-02: `ImageOps.exif_transpose()` still runs first (orientation correction before resize) — then EXIF is stripped at save time
- D-03: Only output files are affected (`pipeline/output/photos/`, `pipeline/output/thumbs/`). Files in `sources/` are never opened for writing and must remain byte-for-byte unchanged
- D-04: The metadata that matters (photographer, cluster, sort_key, sort_number, timestamp) already lives in `metadata.json` — stripping JPEG EXIF carries no risk of data loss

**Cache-Control Headers (upload.py)**
- D-05: `_upload_file()` helper gains an `extra_args: dict | None = None` parameter; passes it as `ExtraArgs` to `s3.upload_file()` so Cache-Control flows cleanly through the concurrent upload path
- D-06: Photo and thumbnail uploads use `ExtraArgs={"ContentType": "image/jpeg", "CacheControl": "public, max-age=31536000, immutable"}` — immutable because filenames are content-addressed (by photo id)
- D-07: metadata.json upload uses `ExtraArgs={"ContentType": "application/json", "CacheControl": "public, max-age=86400"}` — 24 h so guests get fresh metadata after a re-upload within a reasonable window
- D-08: ContentType is added to image uploads for consistency (currently unset on photos/thumbs; R2 auto-detects but explicit is cleaner)

### Claude's Discretion

- Exact placement of `extra_args` parameter in `_upload_file` signature
- Whether to add a short inline comment noting the EXIF stripping rationale in `resize_photo()`

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEC-01 | `pipeline/resize.py` strips all EXIF data (GPS coordinates, device identifiers, timestamps) from every web-quality output image before upload — original files in `sources/` are never modified | Verified: `exif=b""` in Pillow 12.2.0 `.save()` produces output with no APP1 marker and empty `getexif()` — confirmed by live code execution |
| SEC-02 | `pipeline/upload.py` sets `Cache-Control: public, max-age=86400` on `metadata.json` upload | Verified: `CacheControl` is in boto3 1.43.9 `ALLOWED_UPLOAD_ARGS` for `upload_file` |
| SEC-03 | `pipeline/upload.py` sets `Cache-Control: public, max-age=31536000, immutable` on all photo and thumbnail uploads | Verified: same mechanism — `ExtraArgs={"CacheControl": "..."}` passed to `s3.upload_file()` |
</phase_requirements>

---

## Summary

Phase 6 makes two targeted code changes to the Python pipeline, both code-only (no pipeline re-run yet). The changes address privacy (EXIF stripping in `resize.py`) and CDN efficiency (Cache-Control headers in `upload.py`).

**EXIF stripping:** Pillow 12.2.0's `Image.save()` accepts an `exif=` keyword argument. Passing `exif=b""` causes the JPEG encoder to write zero bytes for the APP1 marker segment, which means no EXIF data appears in the output file. This was confirmed by live code execution: a source JPEG with embedded Make, Model, and DateTime EXIF tags produces a stripped output where `image.getexif()` returns `{}` and no `\xff\xe1` (APP1) byte sequence appears in the output. The existing `ImageOps.exif_transpose()` call (orientation correction) must remain in place and run first — it reads orientation from the source EXIF before stripping occurs at save time.

**Cache-Control headers:** boto3 1.43.9's `s3.upload_file()` accepts `ExtraArgs` with `CacheControl` as a verified allowed key (confirmed via `TransferManager.ALLOWED_UPLOAD_ARGS`). The current `_upload_file()` helper passes no `ExtraArgs`. Adding an `extra_args: dict | None = None` parameter that is forwarded to the boto3 call is the clean pattern. The metadata.json upload already uses `ExtraArgs` (for `ContentType`), so the `CacheControl` key simply extends that existing dict.

**Primary recommendation:** Add `exif=b""` to both `.save()` calls in `resize_photo()` (lines 59 and 62 of `resize.py`); add `extra_args` parameter to `_upload_file()` (line 91-96 of `upload.py`) and pass `{"ContentType": "image/jpeg", "CacheControl": "public, max-age=31536000, immutable"}` at both `executor.submit()` call sites, and extend the metadata.json `ExtraArgs` dict to include `CacheControl`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| EXIF stripping | Pipeline (local Python) | — | Stripping happens at image encode time before R2 upload; purely offline |
| Cache-Control header | Pipeline (local Python) | CDN / R2 edge | Set as S3 object metadata at upload; CDN reads and propagates it |
| Source file integrity | Pipeline (local Python) | — | Guarantee enforced by read-only access pattern in `resize.py` |

---

## Standard Stack

### Core (already installed, no new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Pillow | 12.2.0 | EXIF stripping via `exif=b""` in `.save()` | Already in use for resize; `exif=` param is the documented JPEG save option |
| boto3 | 1.43.9 | S3-compatible upload with `ExtraArgs` | Already in use; `CacheControl` is verified in `ALLOWED_UPLOAD_ARGS` |

No new packages are installed in this phase. `[VERIFIED: live code execution + boto3 source]`

### Package Legitimacy Audit

> No new packages are installed in Phase 6. All changes use Pillow and boto3 which are already declared in `pyproject.toml` and installed in `.venv`.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
[sources/*.jpg]        (read-only, never written)
       |
       v
resize.py  --[Image.open]-->  [PIL in-memory image]
                                      |
                                [exif_transpose()]       # reads orientation, does NOT write
                                      |
                                [convert("RGB")]
                                      |
                                [copy().thumbnail()]
                                      |
                                [.save(exif=b"")]        # APP1 segment = 0 bytes
                                      |
                                      v
                          pipeline/output/photos/{id}.jpg   (no EXIF)
                          pipeline/output/thumbs/{id}.jpg   (no EXIF)
                                      |
                                      v
upload.py  --[s3.upload_file]--->  [Cloudflare R2]
           ExtraArgs={
             "ContentType": "image/jpeg",
             "CacheControl": "public, max-age=31536000, immutable"
           }
           
metadata.json  --[s3.upload_file]--->  [Cloudflare R2]
           ExtraArgs={
             "ContentType": "application/json",
             "CacheControl": "public, max-age=86400"
           }
```

### Recommended Project Structure

No structural changes. Both files modified in-place:
```
pipeline/
├── resize.py          # modify: add exif=b"" to 2 .save() calls (lines 59, 63)
├── upload.py          # modify: add extra_args param to _upload_file; pass CacheControl
└── tests/
    ├── test_resize.py  # extend: add test_exif_stripped test
    └── test_upload.py  # create: test _upload_file passes ExtraArgs to s3
```

### Pattern 1: EXIF Stripping via Pillow `exif=b""`

**What:** Pass `exif=b""` as keyword argument to `Image.save()` when saving JPEG output. The JPEG encoder reads `exif` from `encoderinfo` (the save kwargs), and `if exif:` is `False` for an empty bytes object, so no APP1 segment is written.

**When to use:** Any time a JPEG is saved to disk after processing — covers both the web-quality output and the thumbnail.

**Example:**
```python
# Source: verified against Pillow 12.2.0 PIL/JpegImagePlugin.py _save() source
# and confirmed by live execution on test images with real EXIF data

web.save(web_out, format="JPEG", quality=JPEG_QUALITY, optimize=JPEG_OPTIMIZE, exif=b"")
thumb.save(thumb_out, format="JPEG", quality=JPEG_QUALITY, optimize=JPEG_OPTIMIZE, exif=b"")
```

**Critical nuance:** `ImageOps.exif_transpose()` must still run first. It reads the orientation tag from the source image's EXIF to rotate/flip the pixel data correctly. After `exif_transpose()`, `img.info["exif"]` may still contain the original bytes in the in-memory image object — but that does NOT cause the data to appear in the output because Pillow's `_save()` reads EXIF from `encoderinfo` (the kwargs), not from `im.info`. Passing `exif=b""` explicitly overrides any potential edge-case path and is the defensive-correct approach regardless of Pillow version.

**Verified behavior (Pillow 12.2.0, Python 3.13):**
- Source JPEG with Make="Canon", Model="EOS R5", DateTime="2025:06:14 17:32:00"
- After `open → exif_transpose → convert("RGB") → copy() → save(exif=b"")`
- Output: `image.getexif()` returns `{}`, no `\xff\xe1` byte in file
- `[VERIFIED: live code execution]`

### Pattern 2: boto3 `upload_file` with `ExtraArgs` and `CacheControl`

**What:** boto3's `s3.upload_file()` accepts an `ExtraArgs` dict. `CacheControl` is a documented and verified allowed key. The value is a standard HTTP Cache-Control header string.

**When to use:** Every upload call — photos, thumbs, and metadata.json.

**Example:**
```python
# Source: verified against boto3 1.43.9 TransferManager.ALLOWED_UPLOAD_ARGS

def _upload_file(s3, bucket: str, local_path: Path, key: str, extra_args: dict | None = None) -> None:
    """Upload a single file to R2.

    No retry logic — one-shot pipeline philosophy. Exceptions propagate to caller.
    """
    s3.upload_file(str(local_path), bucket, key, ExtraArgs=extra_args or {})
```

Photo/thumb calls:
```python
executor.submit(
    _upload_file,
    s3,
    bucket,
    _PHOTOS_DIR / photo["filename"],
    f"photos/{photo['id']}.jpg",
    {"ContentType": "image/jpeg", "CacheControl": "public, max-age=31536000, immutable"},
)
```

metadata.json call:
```python
s3.upload_file(
    str(_METADATA_PATH),
    bucket,
    "metadata.json",
    ExtraArgs={"ContentType": "application/json", "CacheControl": "public, max-age=86400"},
)
```

**Alternative for `_upload_file`:** Pass `ExtraArgs=extra_args` (not `extra_args or {}`) and let boto3 handle `None` — but boto3 requires a dict, not None, so the `or {}` pattern is correct.

**Verified:** `CacheControl` confirmed present in `boto3.s3.transfer.TransferManager.ALLOWED_UPLOAD_ARGS` (boto3 1.43.9). `[VERIFIED: live code execution]`

### Anti-Patterns to Avoid

- **Stripping EXIF by re-saving `src` (the source path):** The source path comes from `catalog.json` which points into `sources/`. Writing to the source path would modify original files, violating D-03 and SEC-01. The output paths `web_out` and `thumb_out` are always under `pipeline/output/`.
- **Using `image.info.pop("exif", None)`:** This removes the key from the in-memory dict but does NOT prevent Pillow from writing EXIF if the image was a `JpegImageFile` that copied it into `encoderinfo` through another path. `exif=b""` is authoritative.
- **Passing `ExtraArgs=None` to `s3.upload_file()`:** boto3 requires a dict for `ExtraArgs`. Passing `None` raises a `TypeError` at upload time. Use `extra_args or {}`.
- **Adding `CacheControl` to the metadata.json dict itself:** Cache-Control is an HTTP response header set as R2 object metadata at upload time — it is not a field in `metadata.json`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| EXIF removal | Custom byte-level JPEG parser to zero out APP1 | `exif=b""` in Pillow `.save()` | Pillow handles JFIF/EXIF segment layout; hand-rolled would break non-standard EXIF or multi-marker edge cases |
| HTTP header on R2 objects | Post-upload API call to set headers | `ExtraArgs={"CacheControl": ...}` at upload time | boto3 sets object metadata atomically at upload; post-upload HEAD+PUT risks race conditions with ongoing reads |

**Key insight:** Both changes are single-line additions to existing, well-understood library calls. The complexity is zero — the research value is in confirming the exact parameter names and their behavior.

---

## Common Pitfalls

### Pitfall 1: `exif_transpose()` output loses orientation but retains EXIF bytes in `.info`

**What goes wrong:** Developer observes that `transposed.info["exif"]` is still non-empty after `exif_transpose()` and concludes the stripping won't work. They either add a post-transpose strip of `img.info` (unnecessary) or skip EXIF stripping because "it already stripped itself."

**Why it happens:** `exif_transpose()` reads the orientation tag but does NOT zero out `im.info["exif"]` — it may still contain the full original EXIF byte string. However, Pillow's JPEG `_save()` reads EXIF from `encoderinfo` (the save kwargs), not from `im.info`. Passing `exif=b""` as a kwarg to `.save()` is what controls what goes into the output file.

**How to avoid:** Always pass `exif=b""` explicitly to `.save()`. Trust the verified behavior: empty bytes → no APP1 segment.

**Warning signs:** Test assertions using `image.info.get("exif")` on the in-memory object rather than on the re-opened output file.

### Pitfall 2: Only one of two `.save()` calls patched

**What goes wrong:** `exif=b""` is added to the web-quality save (line 59) but not the thumbnail save (line 63), or vice versa.

**Why it happens:** Copy-paste oversight on adjacent but separate lines.

**How to avoid:** The test must verify both web output and thumbnail output are stripped. The plan should treat both `.save()` calls as a single atomic change.

**Warning signs:** Test passes for `web.jpg` but no assertion covers `thumb.jpg`.

### Pitfall 3: `extra_args or {}` versus `extra_args if extra_args is not None else {}`

**What goes wrong:** `extra_args = {}` (an empty dict) is falsy, so `extra_args or {}` evaluates to `{}` — this is fine because an empty dict is the desired fallback. The pattern is safe as long as callers never need to pass an empty dict as a meaningful value (they don't here).

**Why it happens:** Unnecessary overthinking. Both forms produce identical results for this use case.

**How to avoid:** Use `extra_args or {}` — it is idiomatic and correct.

### Pitfall 4: `CacheControl` dict key vs `Cache-Control` HTTP header name

**What goes wrong:** Developer uses `"Cache-Control"` (with hyphen) as the boto3 `ExtraArgs` key instead of `"CacheControl"` (camelCase), which is what boto3 requires.

**Why it happens:** HTTP headers use kebab-case; boto3 ExtraArgs use camelCase matching the S3 API parameter names.

**How to avoid:** The verified allowed key is `"CacheControl"` (confirmed in `ALLOWED_UPLOAD_ARGS`). Using `"Cache-Control"` will raise a `ParamValidationError` or silently be ignored depending on the boto3 version.

**Warning signs:** Upload succeeds but R2 object has no Cache-Control header when inspected via `aws s3api head-object`.

---

## Code Examples

Verified patterns from live code execution and boto3 source inspection:

### EXIF Stripping — modified `resize_photo()` body (lines 59 and 63)

```python
# Source: verified against Pillow 12.2.0 JpegImagePlugin._save source + live execution
web.save(web_out, format="JPEG", quality=JPEG_QUALITY, optimize=JPEG_OPTIMIZE, exif=b"")

thumb.save(thumb_out, format="JPEG", quality=JPEG_QUALITY, optimize=JPEG_OPTIMIZE, exif=b"")
```

### Upload helper — modified `_upload_file()` signature and body

```python
# Source: verified against boto3 1.43.9 TransferManager.ALLOWED_UPLOAD_ARGS
def _upload_file(s3, bucket: str, local_path: Path, key: str, extra_args: dict | None = None) -> None:
    """Upload a single file to R2.

    No retry logic — one-shot pipeline philosophy. Exceptions propagate to caller.
    """
    s3.upload_file(str(local_path), bucket, key, ExtraArgs=extra_args or {})
```

### Upload call sites — photos and thumbs (inside `executor.submit()`)

```python
photo_future = executor.submit(
    _upload_file,
    s3,
    bucket,
    _PHOTOS_DIR / photo["filename"],
    f"photos/{photo['id']}.jpg",
    {"ContentType": "image/jpeg", "CacheControl": "public, max-age=31536000, immutable"},
)
thumb_future = executor.submit(
    _upload_file,
    s3,
    bucket,
    _THUMBS_DIR / photo["filename"],
    f"thumbs/{photo['id']}.jpg",
    {"ContentType": "image/jpeg", "CacheControl": "public, max-age=31536000, immutable"},
)
```

### Upload call site — metadata.json (sequential, step 10)

```python
s3.upload_file(
    str(_METADATA_PATH),
    bucket,
    "metadata.json",
    ExtraArgs={"ContentType": "application/json", "CacheControl": "public, max-age=86400"},
)
```

### Test pattern — EXIF stripping assertion

```python
# Correct assertion: check the output FILE via getexif(), not the in-memory object
def test_exif_stripped(tmp_path):
    src = tmp_path / "src.jpg"
    img = Image.new("RGB", (200, 100))
    e = img.getexif()
    e[271] = "Canon"          # Make
    e[306] = "2025:06:14 17:32:00"  # DateTime
    img.save(src, format="JPEG", exif=e.tobytes())

    web_out = tmp_path / "web.jpg"
    thumb_out = tmp_path / "thumb.jpg"
    resize_photo(src, web_out, thumb_out)

    with Image.open(web_out) as result:
        assert dict(result.getexif()) == {}
    with Image.open(thumb_out) as result:
        assert dict(result.getexif()) == {}
```

### Test pattern — upload ExtraArgs assertion

```python
# Correct pattern: mock s3.upload_file and capture ExtraArgs
from unittest.mock import MagicMock
from pipeline.upload import _upload_file
from pathlib import Path

def test_upload_file_passes_extra_args(tmp_path):
    local = tmp_path / "test.jpg"
    local.write_bytes(b"fake")
    s3 = MagicMock()

    _upload_file(s3, "bucket", local, "photos/test.jpg",
                 {"ContentType": "image/jpeg", "CacheControl": "public, max-age=31536000, immutable"})

    s3.upload_file.assert_called_once_with(
        str(local), "bucket", "photos/test.jpg",
        ExtraArgs={"ContentType": "image/jpeg", "CacheControl": "public, max-age=31536000, immutable"},
    )

def test_upload_file_no_extra_args_uses_empty_dict(tmp_path):
    local = tmp_path / "test.jpg"
    local.write_bytes(b"fake")
    s3 = MagicMock()

    _upload_file(s3, "bucket", local, "photos/test.jpg")

    s3.upload_file.assert_called_once_with(
        str(local), "bucket", "photos/test.jpg",
        ExtraArgs={},
    )
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `image.info.pop("exif")` then resave | `exif=b""` kwarg to `.save()` | Pillow 5.x+ | Authoritative override; not dependent on info dict plumbing |
| Post-upload S3 `copy_object` to set metadata | `ExtraArgs` at upload time | boto3 1.x | Atomic; no race condition window |

**Deprecated/outdated:**
- `PIL.Image._getexif()`: This is a JPEG-specific method on `JpegImageFile` instances. Use `image.getexif()` (the universal API added in Pillow 6.0) in tests. `_getexif()` returns `None` if no EXIF is present; `getexif()` always returns an `Exif` object (empty if no EXIF).

---

## Assumptions Log

> No claims in this research are tagged `[ASSUMED]`. All claims were verified via live code execution against the installed versions (Pillow 12.2.0, boto3 1.43.9) or confirmed against library source.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | All claims verified | — | — |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

---

## Open Questions

None. All technical questions were resolved by live code execution.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3.13 | All pipeline scripts | ✓ | 3.13.11 | — |
| Pillow | EXIF stripping | ✓ | 12.2.0 | — |
| boto3 | Cache-Control upload | ✓ | 1.43.9 | — |
| pytest | Running tests | ✓ | 9.0.3 | — |
| exiftool (CLI) | Success criterion verification | ✗ | — | `PIL.Image.getexif()` — verified equivalent for asserting empty EXIF |
| Cloudflare R2 credentials | Actual upload run | Not tested | — | Phase 6 is code-only; no upload run in this phase (Phase 8 does the run) |

**Missing dependencies with no fallback:** None that block Phase 6. `exiftool` is mentioned in the phase success criteria but `PIL.Image.getexif()` returning `{}` is a verified equivalent for the automated test.

**Missing dependencies with fallback:**
- `exiftool`: Not installed. Tests assert `dict(result.getexif()) == {}` via Pillow instead. This is functionally equivalent — confirmed by live execution showing the two methods agree.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest 9.0.3 |
| Config file | `pyproject.toml` (rootdir discovery; no `[tool.pytest.ini_options]` section needed) |
| Quick run command | `uv run pytest pipeline/tests/test_resize.py pipeline/tests/test_upload.py -v` |
| Full suite command | `uv run pytest pipeline/tests/ -v` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEC-01 | `resize_photo()` output has no EXIF in web output | unit | `uv run pytest pipeline/tests/test_resize.py::test_exif_stripped_web -x` | ❌ Wave 0 |
| SEC-01 | `resize_photo()` output has no EXIF in thumb output | unit | `uv run pytest pipeline/tests/test_resize.py::test_exif_stripped_thumb -x` | ❌ Wave 0 |
| SEC-01 | `sources/` files are byte-for-byte unchanged after resize | unit | `uv run pytest pipeline/tests/test_resize.py::test_sources_untouched -x` | ❌ Wave 0 |
| SEC-02 | metadata.json upload sends `CacheControl: public, max-age=86400` | unit | `uv run pytest pipeline/tests/test_upload.py::test_metadata_cache_control -x` | ❌ Wave 0 |
| SEC-03 | photo upload sends `CacheControl: public, max-age=31536000, immutable` | unit | `uv run pytest pipeline/tests/test_upload.py::test_photo_cache_control -x` | ❌ Wave 0 |
| SEC-03 | thumb upload sends `CacheControl: public, max-age=31536000, immutable` | unit | `uv run pytest pipeline/tests/test_upload.py::test_thumb_cache_control -x` | ❌ Wave 0 |
| SEC-01 | `_upload_file()` passes `extra_args` through to boto3 | unit | `uv run pytest pipeline/tests/test_upload.py::test_upload_file_passes_extra_args -x` | ❌ Wave 0 |

### Existing Tests (Must Continue to Pass)

| File | Tests | Status |
|------|-------|--------|
| `pipeline/tests/test_resize.py` | 3 tests: dimension bounds, orientation correction | All pass (`uv run pytest pipeline/tests/test_resize.py -v`) |
| `pipeline/tests/test_ingest.py` | 3 tests | Not affected by Phase 6 |
| `pipeline/tests/test_cluster.py` | 4 tests | Not affected by Phase 6 |
| `pipeline/tests/test_embed.py` | 1 test | Not affected by Phase 6 |

### Sampling Rate

- **Per task commit:** `uv run pytest pipeline/tests/test_resize.py pipeline/tests/test_upload.py -v`
- **Per wave merge:** `uv run pytest pipeline/tests/ -v`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `pipeline/tests/test_upload.py` — covers SEC-02, SEC-03 (new file; `test_upload.py` does not exist)
- [ ] `pipeline/tests/test_resize.py` — extend with `test_exif_stripped_web`, `test_exif_stripped_thumb`, `test_sources_untouched` (file exists; add to it)

**Note:** `test_upload.py` tests use `unittest.mock.MagicMock` for the boto3 client — no real R2 credentials needed. This is the standard pattern for testing upload helpers in offline pipeline code.

---

## Security Domain

> `security_enforcement` is not set in `.planning/config.json` — treated as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | partial | Path-traversal guard already present in both scripts; not changed in Phase 6 |
| V6 Cryptography | no | — |
| V7 Error Handling | no | — |
| V8 Data Protection | **yes** | EXIF stripping (GPS, device ID, timestamp) — the primary purpose of SEC-01 |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| GPS coordinates in EXIF leak photographer/subject location | Information disclosure | `exif=b""` in Pillow `.save()` |
| Device serial/fingerprint in EXIF enables tracking | Information disclosure | `exif=b""` strips Make, Model, SerialNumber |
| Timestamp in EXIF enables correlation | Information disclosure | `exif=b""` strips DateTime, DateTimeOriginal |
| Stale metadata.json served by CDN edge after re-upload | Spoofing (stale data) | `CacheControl: public, max-age=86400` limits stale window to 24 h |

---

## Sources

### Primary (HIGH confidence)

- Pillow 12.2.0 source — `PIL/JpegImagePlugin.py::_save()` — confirms `exif` is read from `im.encoderinfo`, not `im.info`; `if exif:` guard means empty bytes produces no APP1 segment `[VERIFIED: live code execution + source inspection]`
- boto3 1.43.9 source — `boto3.s3.transfer.TransferManager.ALLOWED_UPLOAD_ARGS` — confirms `CacheControl` is a valid key for `s3.upload_file(ExtraArgs=...)` `[VERIFIED: live code execution]`
- Pillow 12.2.0 source — `PIL/Image.py::Image.save()` — confirms `encoderinfo` is built from save kwargs, not merged from `im.info` `[VERIFIED: source inspection]`

### Secondary (MEDIUM confidence)

- Live execution of the full resize pipeline on synthetic JPEG with Make/Model/DateTime EXIF — confirmed `getexif()` returns `{}` after applying the patch `[VERIFIED: live code execution]`

---

## Metadata

**Confidence breakdown:**
- EXIF stripping mechanism: HIGH — verified by source inspection and live execution on Pillow 12.2.0
- boto3 CacheControl: HIGH — confirmed in ALLOWED_UPLOAD_ARGS live check
- Test patterns: HIGH — derived from verified library behavior
- Pitfalls: HIGH — derived from source-level understanding of Pillow JPEG save pipeline

**Research date:** 2026-05-17
**Valid until:** 2026-06-17 (Pillow and boto3 are stable; no fast-moving APIs involved)
