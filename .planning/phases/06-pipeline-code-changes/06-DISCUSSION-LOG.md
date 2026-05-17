# Phase 6: Pipeline Code Changes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in 06-CONTEXT.md — this log preserves the discussion.

**Date:** 2026-05-17
**Phase:** 06-pipeline-code-changes
**Mode:** discuss (default)
**Areas analyzed:** EXIF stripping method, ContentType on image uploads, _upload_file helper design

## Gray Areas Presented

| Area | Options Presented |
|------|------------------|
| EXIF stripping method | exif=b"" in PIL save() calls / piexif library / trust convert("RGB") implicitly |
| ContentType on image uploads | Add ContentType: image/jpeg alongside CacheControl / leave unset (R2 auto-detects) |
| _upload_file helper design | Add extra_args param / inline boto3 call / switch to s3.put_object |

## User Response

User selected all areas but indicated no strong preference — confirmed that the most important constraint is:
> "We should only make those changes on the copy of images and maintain the relevant metadata that we want to save (photographer, sort_number, cluster...)"

This confirmed that:
1. EXIF stripping applies only to pipeline output copies, never `sources/`
2. The "relevant metadata" (photographer, cluster, sort_key) lives in `metadata.json` — not in JPEG EXIF — so stripping is safe
3. Standard implementation decisions (explicit `exif=b""`, `extra_args` param, ContentType on images) are at Claude's discretion

## Decisions Applied

- EXIF: explicit `exif=b""` in PIL `.save()` — guaranteed strip regardless of Pillow version
- Cache-Control: `_upload_file` gains `extra_args` param; photos/thumbs get `CacheControl: public, max-age=31536000, immutable`; metadata.json gets `CacheControl: public, max-age=86400`
- ContentType: added `image/jpeg` to photo/thumb uploads for consistency

## Corrections Made

None — all assumptions confirmed.

## Deferred Ideas

None.
