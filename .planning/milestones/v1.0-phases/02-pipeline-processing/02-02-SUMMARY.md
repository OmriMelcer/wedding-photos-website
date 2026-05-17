---
phase: 02-pipeline-processing
plan: 02
subsystem: pipeline/ingest
tags: [python, exif, pillow, catalog, ingest]
dependency_graph:
  requires:
    - 02-01  # wave 1 scaffolding — stubs + tests in RED
  provides:
    - pipeline/output/catalog.json  # consumed by embed.py (02-03) and cluster.py (02-04)
  affects:
    - pipeline/embed.py   # reads catalog.json embed_index
    - pipeline/cluster.py # reads catalog.json timestamp + has_exif
tech_stack:
  added:
    - Pillow EXIF extraction via `Image._getexif()` and `PIL.ExifTags.TAGS` reverse-lookup
  patterns:
    - Path-traversal guard reused from acquire_google.py (`_resolve_output_dir`)
    - ISRAEL_TZ constant (`timezone(timedelta(hours=2))`) for all timestamp normalization
    - Pitfall #1/#5 (RESEARCH.md): ALL OffsetTimeOriginal values (including "+00:00", "+03:00") ignored; naive datetime always replaced with ISRAEL_TZ
key_files:
  created: []
  modified:
    - pipeline/ingest.py
decisions:
  - "ALL camera offsets (including +00:00 and +03:00) treated as Israel local time — OffsetTimeOriginal unreliable on these cameras (RESEARCH.md Pitfall #1 and #5)"
  - "photo_id = {label}_{file_stem} to prevent cross-folder filename collisions (RESEARCH.md Pitfall #4)"
  - "has_exif in catalog.json reflects actual usable timestamp — False if config says has_exif=true but DateTimeOriginal is blank"
  - "Missing source directories: warn to stderr + continue (not fatal) — handles pic_time not yet downloaded"
metrics:
  duration: ~5 minutes
  completed: 2026-05-16
  task_count: 2
  file_count: 1
---

# Phase 02 Plan 02: Ingest Stage — EXIF Extraction + Catalog Summary

One-liner: EXIF timestamp extraction with Israel-local-time normalization producing catalog.json with 1327 entries across 3 photographers.

## What Was Built

`pipeline/ingest.py` — Stage 1 of the Phase 2 processing pipeline. Walks every source folder declared in `pipeline/config.yaml sources.local_sources`, extracts EXIF `DateTimeOriginal` from digital photos, assigns photographer labels from config, and writes `pipeline/output/catalog.json`.

## Catalog Statistics

| Photographer     | Total photos | With EXIF (digital) | Without EXIF (film/null) |
|------------------|-------------|---------------------|--------------------------|
| abir_sultan      | 732         | 558                 | 174                      |
| inbal_zeldin     | 295         | 295                 | 0                        |
| magnate_images   | 300         | 300                 | 0                        |
| **TOTAL**        | **1327**    | **1153**            | **174**                  |

All 1153 digital timestamps end in `+02:00` (Israel Standard Time). Zero timestamps end in any other offset.

The 174 film-scan entries (`abir_sultan_film` source folder, `has_exif: false` in config) carry `timestamp: null` and `has_exif: false` in catalog.json. These are routed to CLIP KNN clustering in plan 02-04.

## Timezone Decision (+00:00 / +03:00 → Israel Local Time)

Camera EXIF tags on these photographers' cameras report `OffsetTimeOriginal` values of `+00:00` or `+03:00`, but the `DateTimeOriginal` field stores **Israel wall-clock time** in both cases — not UTC and not UTC+3.

Decision: For **all** offset values (including `+02:00`, `+00:00`, `+03:00`, and missing), interpret the naive `DateTimeOriginal` as Israel local time by replacing `tzinfo` with `ISRAEL_TZ = timezone(timedelta(hours=2))` directly — no offset arithmetic applied.

This is the explicit mitigation for RESEARCH.md Pitfall #1 ("+00:00 on these cameras means local Israel time, NOT UTC") and Pitfall #5 ("+03:00 also unreliable — cameras misconfigured"). Applying offset arithmetic would shift every timestamp by 2–3 hours, causing widespread cluster misassignment.

Inline comment in `extract_timestamp()` references Pitfall #1/#5 and documents the decision.

## Anomalies and Notable Findings

1. **pic_time source directory**: `sources/pic_time` does not exist (deferred to Phase 3 per RESEARCH.md Open Question 2). The script prints a warning to stderr and skips gracefully — exits 0.

2. **abir_sultan_film**: 174 film scans with blank `DateTimeOriginal` — correctly returns `None` from `extract_timestamp()` (RESEARCH.md Pitfall #3 mitigation). Config entry has `has_exif: false` which is the primary guard; the blank-check in `extract_timestamp` is a secondary defense.

3. **No source directories missing** (other than pic_time): All three active photographer folders (`sources/abir_sultan`, `sources/abir_sultan_film`, `sources/inbal_zeldin`, `sources/magnate_images`) exist and were processed successfully.

## Test Results

```
pipeline/tests/test_ingest.py::test_exif_normalization PASSED
pipeline/tests/test_ingest.py::test_zero_offset_treated_as_local PASSED
pipeline/tests/test_ingest.py::test_photographer_label PASSED
```

All 3 ingest tests (covering PIPE-01 and PIPE-02) are GREEN. Other test files (embed, cluster, resize) remain RED as expected — those plans have not yet been executed.

## Deviations from Plan

None — plan executed exactly as written. The Pitfall #1/#5 timezone decision was pre-specified in the plan and RESEARCH.md.

## Threat Surface Scan

No new security-relevant surface beyond the plan's `<threat_model>`:
- `_resolve_output_dir()` path-traversal guard applied to both source directory resolution and output directory creation (T-02-03 mitigated).
- EXIF data from private wedding photos — not attacker-controlled (T-02-04 accepted).
- `catalog.json` in `pipeline/output/` which is gitignored — not committed or uploaded to R2 (T-02-05 accepted).

## Known Stubs

None. All catalog fields are populated from real source data. Downstream stubs (embed_index used by embed.py, cluster fields populated by cluster.py) are not stubs in this plan — they are intentionally deferred to plans 02-03 and 02-04.

## Self-Check: PASSED

- [x] `pipeline/ingest.py` modified and committed (c776130)
- [x] `uv run pytest pipeline/tests/test_ingest.py -v` — 3 passed
- [x] `uv run python pipeline/ingest.py` — exits 0, 1327 photos cataloged
- [x] Catalog validation: unique IDs, sequential embed_index, all digital timestamps end +02:00
