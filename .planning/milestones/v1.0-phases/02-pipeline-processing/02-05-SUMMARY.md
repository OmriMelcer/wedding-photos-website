---
phase: "02"
plan: "05"
subsystem: pipeline
tags: [resize, thumbnails, EXIF, pillow, web-images]
dependency_graph:
  requires: [02-04-cluster]
  provides: [pipeline/output/photos/, pipeline/output/thumbs/]
  affects: [Phase 3 upload]
tech_stack:
  added: []
  patterns: [EXIF transpose before resize, img.copy() guard, RGB normalisation]
key_files:
  created: []
  modified:
    - pipeline/resize.py
decisions:
  - Used ImageOps.exif_transpose before resize to correct portrait phone photo orientation
  - Used img.copy() before each thumbnail() call to preserve high-resolution data for the web output
  - Applied img.convert("RGB") after EXIF transpose to handle RGBA, palette, CMYK, and grayscale source images
  - Security filename guard rejects any filename containing "/" or ".." before constructing output paths
metrics:
  duration: "~7 minutes (1327 photos, CPU)"
  completed: "2026-05-16"
---

# Phase 2 Plan 05: Resize Pipeline Summary

Implemented `pipeline/resize.py` — Stage 4 of the offline pipeline. Reads `metadata.json` and `catalog.json`, locates each source image, corrects EXIF orientation, and writes a web-quality JPEG (longest edge <= 2000px) and a thumbnail JPEG (longest edge <= 400px) to `pipeline/output/`.

## Final Counts

| Metric | Count |
|--------|-------|
| Photos in metadata.json | 1327 |
| Web images written (pipeline/output/photos/) | 1327 |
| Thumbnails written (pipeline/output/thumbs/) | 1327 |
| Photos skipped / failed | 0 |

metadata.json size: 398 KB (well under the 1 MB constraint).

## Source Files Not Found

None. All 1327 source photos were located and processed successfully.

## Full Test Suite — Phase 2 Completion Gate

All 11 Phase 2 tests pass:

```
pipeline/tests/test_cluster.py::test_time_window_assignment        PASSED
pipeline/tests/test_cluster.py::test_knn_assignment                PASSED
pipeline/tests/test_cluster.py::test_exif_confidence_is_one        PASSED
pipeline/tests/test_cluster.py::test_low_confidence_flagged        PASSED
pipeline/tests/test_embed.py::test_embedding_shape_normalized       PASSED
pipeline/tests/test_ingest.py::test_exif_normalization             PASSED
pipeline/tests/test_ingest.py::test_zero_offset_treated_as_local   PASSED
pipeline/tests/test_ingest.py::test_photographer_label             PASSED
pipeline/tests/test_resize.py::test_web_image_max_dimension        PASSED
pipeline/tests/test_resize.py::test_thumb_max_dimension            PASSED
pipeline/tests/test_resize.py::test_exif_orientation_corrected     PASSED

11 passed in 3.47s
```

## Orientation Spot-Check

Checked portrait-oriented photos from `abir_sultan` (photographer who shot many portrait stills with phone/mirrorless cameras). Sample of confirmed correct output dimensions after EXIF transpose:

| Photo ID | Web output dimensions |
|----------|----------------------|
| abir_sultan_ABR50433 | 1800x2000 (portrait — height is longest edge) |
| abir_sultan_ABR50462 | 1831x2000 (portrait) |
| abir_sultan_ABR50486 | 1519x2000 (portrait) |

These confirm that `ImageOps.exif_transpose` is being applied correctly: the pixel dimensions reflect the intended orientation rather than the raw sensor layout.

## Phase 2 Exit Gate — Artifact Checklist

All required artifacts are present in `pipeline/output/`:

| Artifact | Status | Size |
|----------|--------|------|
| catalog.json | present | 298 KB |
| embeddings.npy | present | 2.6 MB |
| metadata.json | present | 398 KB |
| low_confidence.txt | present | 386 B (3 low-conf film scans flagged) |
| photos/ (1327 files) | present | ~42 KB dir entry |
| thumbs/ (1327 files) | present | ~42 KB dir entry |

Pipeline is ready for Phase 3 upload to Cloudflare R2.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- pipeline/resize.py: present and implements resize_photo + main
- 02-05-SUMMARY.md: this file
- 11/11 tests GREEN confirmed by pytest run above
- 1327/1327 web + thumb files confirmed by os.listdir count
