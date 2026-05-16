---
phase: 02-pipeline-processing
plan: "01"
subsystem: pipeline
tags: [ml-deps, pytest, tdd, red-tests, config]
dependency_graph:
  requires: []
  provides: [pipeline-test-scaffold, ml-dependencies, config-time-windows]
  affects: [pyproject.toml, pipeline/config.yaml, pipeline/tests/]
tech_stack:
  added:
    - open-clip-torch==3.3.0
    - scikit-learn==1.8.0
    - torch==2.12.0 (transitive)
    - torchvision==0.27.0 (transitive)
    - pytest==9.0.3 (dev)
  patterns:
    - pytest fixtures in conftest.py
    - RED-first TDD stubs (NotImplementedError)
    - pipeline as importable Python package
key_files:
  created:
    - pyproject.toml (updated with ML deps + dev pytest)
    - pipeline/config.yaml (added events.time_windows block)
    - pipeline/__init__.py (makes pipeline an importable package)
    - pipeline/ingest.py (stub)
    - pipeline/embed.py (stub)
    - pipeline/cluster.py (stub)
    - pipeline/resize.py (stub)
    - pipeline/tests/__init__.py
    - pipeline/tests/conftest.py
    - pipeline/tests/test_ingest.py
    - pipeline/tests/test_embed.py
    - pipeline/tests/test_cluster.py
    - pipeline/tests/test_resize.py
    - .gitignore (updated)
  modified: []
decisions:
  - Created pipeline/__init__.py to make `pipeline` an importable package (required for pytest collection)
  - Created stub pipeline modules (ingest.py, embed.py, cluster.py, resize.py) raising NotImplementedError to enable test collection while keeping tests RED
  - Used NotImplementedError (not ImportError) as RED signal — clearer than missing module
metrics:
  completed_date: "2026-05-16"
---

# Phase 02 Plan 01: ML Dependencies, Test Scaffold, Config Time Windows Summary

Installed ML and test dependencies via uv, scaffolded the pytest test tree with shared fixtures, wrote 11 RED test stubs for PIPE-01 through PIPE-07, and extended pipeline/config.yaml with the five event time windows for EXIF-based cluster assignment.

## pyproject.toml Dependency Entries Added

```toml
[project]
dependencies = [
    "open-clip-torch>=3.3.0",
    "scikit-learn>=1.8.0",
]

[dependency-groups]
dev = [
    "pytest>=9.0.3",
]
```

Resolved versions (from uv.lock):
- open-clip-torch 3.3.0
- scikit-learn 1.8.0
- torch 2.12.0 (transitive)
- torchvision 0.27.0 (transitive)
- pytest 9.0.3

## conftest.py Fixture Signatures

```python
@pytest.fixture
def tiny_jpeg(tmp_path: Path) -> Path:
    """Creates a 10x10 white JPEG, saves to tmp_path/fixture.jpg, returns Path."""

@pytest.fixture
def fixture_embeddings() -> np.ndarray:
    """Returns (5, 512) float32 array seeded with rng(42), L2-normalized per row."""

@pytest.fixture
def fixture_config() -> dict:
    """Returns full config dict with pipeline.events.time_windows and confidence_threshold."""
```

## 11 Test Function Names

- `pipeline/tests/test_ingest.py`:
  1. `test_exif_normalization`
  2. `test_zero_offset_treated_as_local`
  3. `test_photographer_label`

- `pipeline/tests/test_embed.py`:
  4. `test_embedding_shape_normalized`

- `pipeline/tests/test_cluster.py`:
  5. `test_time_window_assignment`
  6. `test_knn_assignment`
  7. `test_exif_confidence_is_one`
  8. `test_low_confidence_flagged`

- `pipeline/tests/test_resize.py`:
  9. `test_web_image_max_dimension`
  10. `test_thumb_max_dimension`
  11. `test_exif_orientation_corrected`

## Test Suite Status: RED (expected)

`uv run pytest pipeline/tests/ --collect-only -q` → 11 tests collected, exit 0.

`uv run pytest pipeline/tests/ -x` → exit 1, first failure:
```
FAILED pipeline/tests/test_cluster.py::test_time_window_assignment
NotImplementedError: assign_cluster_by_time not yet implemented
```

All 11 tests fail with NotImplementedError from stub modules. This is the correct RED state — implementations will be added in Plans 02-02 through 02-05.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created pipeline stub modules to enable test collection**
- **Found during:** Task 3 verification (--collect-only)
- **Issue:** pytest --collect-only exited 2 (not 0) because imports from `pipeline.ingest`, `pipeline.embed`, `pipeline.cluster`, `pipeline.resize` failed — those modules didn't exist yet
- **Fix:** Created `pipeline/__init__.py` (package marker) and four stub modules (`ingest.py`, `embed.py`, `cluster.py`, `resize.py`) with function signatures raising `NotImplementedError`. Tests can now be collected (import succeeds) but still fail when run (RED state).
- **Files modified:** pipeline/__init__.py, pipeline/ingest.py, pipeline/embed.py, pipeline/cluster.py, pipeline/resize.py
- **Note:** The plan acceptance criteria requires `--collect-only` to exit 0 — this was only achievable with importable stubs. Later plans will replace these stubs with real implementations.

## Self-Check: PASSED
