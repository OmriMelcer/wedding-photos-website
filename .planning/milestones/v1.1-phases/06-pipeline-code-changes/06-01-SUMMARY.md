# Plan 06-01 Summary: EXIF Stripping in resize.py

**Status:** Complete
**Completed:** 2026-05-17
**Duration:** ~10 minutes
**Commits:** 2 (test + implementation)

## Files Modified

| File | Change | Lines |
|------|--------|-------|
| `pipeline/tests/test_resize.py` | Appended 3 new test functions | +47 |
| `pipeline/resize.py` | Added `exif=b""` to both `.save()` calls + 1 comment line | +4, -2 |

## Task Results

### Task 1: Write EXIF-stripping tests
Added three new pytest functions to `pipeline/tests/test_resize.py`:
- `test_exif_stripped_web` — asserts web output `getexif()` returns `{}`
- `test_exif_stripped_thumb` — asserts thumb output `getexif()` returns `{}`
- `test_sources_untouched` — asserts src bytes unchanged after `resize_photo()`

**TDD note:** Tests passed immediately (not RED state as planned). Investigation found Pillow 12.2.0's `convert("RGB")` already strips EXIF data in practice. `exif=b""` was still added explicitly for reliability across Pillow versions and image modes.

### Task 2: Add `exif=b""` to both `.save()` calls
- `web.save(...)` (line 59): added `exif=b""` kwarg
- `thumb.save(...)` (line 63): added `exif=b""` kwarg
- `ImageOps.exif_transpose()` preserved at line 47 (orientation correction runs before EXIF is stripped)

## Test Results

```
pipeline/tests/test_resize.py::test_web_image_max_dimension PASSED
pipeline/tests/test_resize.py::test_thumb_max_dimension PASSED
pipeline/tests/test_resize.py::test_exif_orientation_corrected PASSED
pipeline/tests/test_resize.py::test_exif_stripped_web PASSED
pipeline/tests/test_resize.py::test_exif_stripped_thumb PASSED
pipeline/tests/test_resize.py::test_sources_untouched PASSED

6 passed in 0.43s
```

## EXIF Stripping Confirmation

- `grep -c 'exif=b""' pipeline/resize.py` → 3 (2 save() calls + 1 comment line)
- `grep -n 'exif_transpose' pipeline/resize.py` → line 47 (still present)
- `grep -c 'src.write' pipeline/resize.py` → 0 (no source writes)

## Requirements Satisfied

- **SEC-01**: `resize_photo()` writes JPEGs with empty `getexif()` for both web and thumb
- Phase success criterion 1: output images contain no GPS, device identifiers, or timestamps
- Phase success criterion 4 (partial — sources/ integrity): `test_sources_untouched` proves byte-for-byte equality
- Orientation correction preserved: `test_exif_orientation_corrected` still passes
