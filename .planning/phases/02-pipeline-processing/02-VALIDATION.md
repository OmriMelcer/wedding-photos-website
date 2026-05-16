---
phase: 2
slug: pipeline-processing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-16
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest (not yet installed) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `uv run pytest pipeline/tests/ -x -q` |
| **Full suite command** | `uv run pytest pipeline/tests/ -v` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `uv run pytest pipeline/tests/ -x -q`
- **After every plan wave:** Run `uv run pytest pipeline/tests/ -v`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 0 | PIPE-01 | — | N/A | unit | `uv run pytest pipeline/tests/test_ingest.py::test_exif_normalization -x` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 0 | PIPE-01 | — | N/A | unit | `uv run pytest pipeline/tests/test_ingest.py::test_zero_offset_treated_as_local -x` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 0 | PIPE-02 | — | N/A | unit | `uv run pytest pipeline/tests/test_ingest.py::test_photographer_label -x` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 0 | PIPE-03 | — | N/A | unit | `uv run pytest pipeline/tests/test_embed.py::test_embedding_shape_normalized -x` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 0 | PIPE-04 | — | N/A | unit | `uv run pytest pipeline/tests/test_cluster.py::test_time_window_assignment -x` | ❌ W0 | ⬜ pending |
| 2-03-02 | 03 | 0 | PIPE-05 | — | N/A | unit | `uv run pytest pipeline/tests/test_cluster.py::test_knn_assignment -x` | ❌ W0 | ⬜ pending |
| 2-03-03 | 03 | 0 | PIPE-06 | — | N/A | unit | `uv run pytest pipeline/tests/test_cluster.py::test_exif_confidence_is_one -x` | ❌ W0 | ⬜ pending |
| 2-03-04 | 03 | 0 | PIPE-06 | — | N/A | integration | `uv run pytest pipeline/tests/test_cluster.py::test_low_confidence_flagged -x` | ❌ W0 | ⬜ pending |
| 2-04-01 | 04 | 0 | PIPE-07 | — | N/A | unit | `uv run pytest pipeline/tests/test_resize.py::test_web_image_max_dimension -x` | ❌ W0 | ⬜ pending |
| 2-04-02 | 04 | 0 | PIPE-07 | — | N/A | unit | `uv run pytest pipeline/tests/test_resize.py::test_thumb_max_dimension -x` | ❌ W0 | ⬜ pending |
| 2-04-03 | 04 | 0 | PIPE-07 | — | N/A | unit | `uv run pytest pipeline/tests/test_resize.py::test_exif_orientation_corrected -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `uv add --dev pytest` — install pytest
- [ ] `pipeline/tests/__init__.py` — empty init
- [ ] `pipeline/tests/conftest.py` — shared fixtures (fixture JPEG, fixture embeddings array, fixture config)
- [ ] `pipeline/tests/test_ingest.py` — stubs for PIPE-01, PIPE-02
- [ ] `pipeline/tests/test_embed.py` — stubs for PIPE-03 (mock open_clip; no model download)
- [ ] `pipeline/tests/test_cluster.py` — stubs for PIPE-04, PIPE-05, PIPE-06 (fixture embeddings; no CLIP model)
- [ ] `pipeline/tests/test_resize.py` — stubs for PIPE-07 (tiny fixture JPEG with orientation tag)

*test_embed.py must mock `open_clip.create_model_and_transforms` — do not download the model in tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Spot-check that inbal_zeldin timestamps are correct local time | PIPE-01 | Requires looking at known-hupa photo in the actual source dir | Pick one inbal_zeldin photo from hupa window, check `DateTimeOriginal` vs the output cluster assignment |
| Verify low_confidence.txt is human-readable before upload proceeds | PIPE-06 | Visual review of flagged film photos | Open `pipeline/output/low_confidence.txt` and confirm entries make sense |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
