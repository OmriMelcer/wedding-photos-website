---
phase: "02"
plan: "04"
subsystem: pipeline
tags: [cluster, exif, knn, clip, metadata]
dependency_graph:
  requires: [02-03]
  provides: [pipeline/output/metadata.json, pipeline/output/low_confidence.txt]
  affects: [site/src]
tech_stack:
  added: [scikit-learn NearestNeighbors]
  patterns: [EXIF time-window labeling, KNN centroid assignment, cosine distance confidence]
key_files:
  created: []
  modified: [pipeline/cluster.py]
decisions:
  - Treat naive datetime inputs (no tzinfo) as Israel local time — avoids system-TZ conversion errors in tests
  - Confidence for film KNN is 1.0 - cosine_distance (sklearn cosine metric already in [0,2] range so 1-d stays in [0,1])
  - write_low_confidence_report accepts both 'id' and 'photo_id' keys for entry identity — supports test fixtures and real entries
metrics:
  duration: "~2 minutes"
  completed: "2026-05-16"
  tasks_completed: 2
  files_modified: 1
---

# Phase 02 Plan 04: Cluster Assignment + metadata.json Summary

Implemented `pipeline/cluster.py` — Stage 3 of the pipeline. Combines `catalog.json` + `embeddings.npy` + `config.yaml` time windows to produce the upload-ready `pipeline/output/metadata.json` (1327 photos) and `pipeline/output/low_confidence.txt`.

## Per-Cluster Photo Counts

| Cluster | Total | Digital (EXIF) | Film (KNN) | EXIF Anchors for Centroid |
|---------|-------|----------------|------------|--------------------------|
| prep | 169 | 90 | 79 | 90 |
| photoshooting | 156 | 137 | 19 | 137 |
| dining | 382 | 373 | 9 | 373 |
| hupa | 176 | 172 | 4 | 172 |
| dancing | 444 | 381 | 63 | 381 |
| **Total** | **1327** | **1153** | **174** | **1153** |

All 5 clusters have EXIF anchors (Open Question 3 resolved — prep has 90 digital anchors). No empty centroids.

## metadata.json File Stats

- Size: 397.8 KB (well under the 1MB constraint)
- Photos: 1327 entries, all with valid cluster values and `faces=[]`
- `people`: `[]` as required for Phase 2 face-filter hiding behavior

## Low-Confidence Report

3 photos flagged below the 0.7 threshold (all film scans):

```
abir_sultan_000016040014 | dancing | 0.70 | sources/abir_sultan_film/000016040014.jpg
abir_sultan_000016060008 | photoshooting | 0.68 | sources/abir_sultan_film/000016060008.jpg
abir_sultan_000016060012 | photoshooting | 0.67 | sources/abir_sultan_film/000016060012.jpg
```

(Note: first entry stores as `cluster_confidence=0.6994` which rounds to `0.70` for display — correctly flagged as `0.6994 < 0.7`)

## Hupa Spot-Check

Verified 7 `inbal_zeldin` digital photos with timestamps in 18:00-18:40 window — all assigned `cluster=hupa`, `confidence=1.0`.

Example:
- `inbal_zeldin_NOA & OMRI 00117`: `ts=2026-05-01T18:02:18+02:00` → `cluster=hupa`, `confidence=1.0` ✓
- `inbal_zeldin_NOA & OMRI 00003`: `ts=2026-05-01T18:38:49+02:00` → `cluster=hupa`, `confidence=1.0` ✓

## Test Results

All 4 cluster tests pass:

```
pipeline/tests/test_cluster.py::test_time_window_assignment PASSED
pipeline/tests/test_cluster.py::test_knn_assignment PASSED
pipeline/tests/test_cluster.py::test_exif_confidence_is_one PASSED
pipeline/tests/test_cluster.py::test_low_confidence_flagged PASSED
4 passed in 0.85s
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Handle naive datetime in assign_cluster_by_time**
- **Found during:** Task 1 test run
- **Issue:** The plan specified `dt_israel.astimezone(ISRAEL_TZ).time()` — calling `.astimezone()` on a naive datetime converts via the local system timezone first, not Israel time. Test fixtures pass naive `datetime(2026, 5, 1, 8, 30)` which expected Israel local interpretation.
- **Fix:** Added a tzinfo check — if naive, use `.time()` directly; if aware, convert via `.astimezone(ISRAEL_TZ)` first.
- **Files modified:** `pipeline/cluster.py`
- **Commit:** N/A (fixed inline before first commit)

## Self-Check: PASSED

- `pipeline/cluster.py` exists and contains full implementation
- All 4 cluster tests pass
- `pipeline/output/metadata.json` validated (1327 photos, correct schema)
- `pipeline/output/low_confidence.txt` has correct header format
