# Testing Patterns

**Analysis Date:** 2026-05-16

> **Note:** This codebase is at pre-implementation stage. No test files, test framework configuration, or test infrastructure exists. The analysis below documents the current state (no testing) and provides recommended patterns aligned with the project's tech stack and one-shot pipeline architecture.

## Test Framework

**Runner:**
- Not configured. No `pytest.ini`, `setup.cfg`, `vitest.config.*`, or `jest.config.*` found.
- `pyproject.toml` has no `[tool.pytest.ini_options]` section.

**Recommended (Python pipeline):**
- `pytest` via `uv` toolchain
- Add to `pyproject.toml`:
  ```toml
  [tool.pytest.ini_options]
  testpaths = ["tests"]
  ```

**Recommended (React site):**
- Vitest (ships with Vite scaffold)
- Config file: `site/vitest.config.js`

**Assertion Library:**
- Python: `pytest` built-in assertions
- JS: Vitest built-in (`expect`)

**Run Commands:**
```bash
# Python tests (none yet)
uv run pytest

# React tests (none yet — after Vite scaffold)
cd site && npm test
cd site && npm run coverage
```

## Test File Organization

**Location:**
- No test files exist anywhere in the repo.

**Recommended Python layout:**
- Separate `tests/` directory at repo root (not co-located with pipeline scripts)

**Recommended JS layout:**
- Co-located with components: `site/src/Gallery.test.jsx`
- Or separate: `site/src/__tests__/Gallery.test.jsx`

**Naming:**
- Python: `test_<module>.py` (e.g., `test_ingest.py`, `test_cluster.py`)
- JS/React: `<Component>.test.jsx` or `<Component>.spec.jsx`

**Recommended structure:**
```
wedding-album/
├── tests/
│   ├── test_ingest.py
│   ├── test_cluster.py
│   └── fixtures/
│       └── sample_metadata.json
├── site/
│   └── src/
│       ├── Gallery.test.jsx
│       └── Filters.test.jsx
```

## Test Structure

**Suite Organization (Python — recommended):**
```python
import pytest
from pipeline.cluster import assign_cluster

def test_exif_photo_assigned_by_timestamp():
    photo = {"timestamp": "2025-06-14T17:32:00", "has_exif": True}
    result = assign_cluster(photo, time_windows={...})
    assert result == "hupa"

def test_film_photo_assigned_by_knn():
    embedding = [0.1, 0.2, ...]  # mock CLIP vector
    result = assign_cluster_knn(embedding, centroids={...})
    assert result in ["prep", "photoshooting", "hupa", "dining", "party"]
```

**Suite Organization (React — recommended):**
```jsx
import { render, screen } from '@testing-library/react'
import Filters from './Filters'

describe('Filters', () => {
  it('hides face filter when people array is empty', () => {
    render(<Filters people={[]} photographers={['A']} clusters={['hupa']} />)
    expect(screen.queryByText(/person/i)).not.toBeInTheDocument()
  })

  it('shows face filter when people array is populated', () => {
    render(<Filters people={[{ id: 'p1', name: 'Dana' }]} photographers={['A']} clusters={['hupa']} />)
    expect(screen.getByText(/Dana/i)).toBeInTheDocument()
  })
})
```

**Patterns:**
- Setup: inline test data or `fixtures/` directory for sample JSON
- Teardown: not applicable (pure functions, no side effects in pipeline logic)
- Assertion: direct value equality for cluster assignment; DOM queries for React components

## Mocking

**Framework:**
- Python: `pytest-mock` or `unittest.mock`
- JS: Vitest built-in mocking (`vi.mock()`)

**Python Patterns (recommended):**
```python
from unittest.mock import patch, MagicMock

def test_upload_calls_r2(mocker):
    mock_s3 = mocker.patch("pipeline.upload.boto3.client")
    run_upload(metadata_path="tests/fixtures/sample_metadata.json")
    mock_s3.return_value.put_object.assert_called_once()
```

**JS Patterns (recommended):**
```js
vi.mock('./metadata.json', () => ({
  default: {
    photos: [{ id: 'img_0001', cluster: 'hupa', photographer: 'A' }],
    people: []
  }
}))
```

**What to Mock:**
- R2/S3 upload calls (`boto3.client`) in `upload.py` tests
- CLIP model loading in `embed.py` tests (slow, GPU/CPU intensive)
- `fetch()` calls in React tests (metadata.json network request)
- File system I/O in `ingest.py` and `resize.py` tests

**What NOT to Mock:**
- Cluster assignment logic (pure function — test with real inputs)
- Filter logic in React components (test with real props)
- EXIF timestamp parsing (test with real fixture images or mock EXIF dicts)

## Fixtures and Factories

**Test Data (recommended):**
```python
# tests/fixtures/sample_metadata.json
{
  "photos": [
    {
      "id": "img_0001",
      "filename": "img_0001.jpg",
      "r2_url": "https://r2.example.com/photos/img_0001.jpg",
      "thumb_url": "https://r2.example.com/thumbs/img_0001.jpg",
      "photographer": "photographer_a",
      "timestamp": "2025-06-14T17:32:00",
      "cluster": "hupa",
      "cluster_confidence": 0.91,
      "faces": []
    }
  ],
  "people": []
}
```

**Location:**
- `tests/fixtures/` for Python (sample images, sample metadata JSON)
- `site/src/__tests__/fixtures/` for JS component tests

## Coverage

**Requirements:** None enforced (no coverage tool configured)

**View Coverage:**
```bash
# Python (after pytest-cov is added)
uv run pytest --cov=pipeline --cov-report=html

# React (after Vitest configured)
cd site && npm run coverage
```

## Test Types

**Unit Tests:**
- Most critical for pipeline: cluster assignment logic, EXIF timestamp parsing, metadata schema validation
- Most critical for UI: `Filters.jsx` face-filter visibility rule (`people.length === 0` hides filter)

**Integration Tests:**
- Pipeline end-to-end: run `ingest → cluster → resize` on a small fixture folder and assert `metadata.json` shape
- React: render `App.jsx` with mocked `fetch` returning sample metadata, verify gallery renders

**E2E Tests:**
- Not applicable at launch (one-day budget, no CI configured)
- Playwright could be added post-launch for smoke testing the deployed static site

## Critical Behaviors to Test

These are spec-defined behaviors that must not regress:

1. **Face filter hidden by default** — `Filters.jsx` must not render the face/person filter when `people.length === 0` (`site/src/Filters.jsx`)
2. **Cluster assignment correctness** — EXIF photos land in correct time-window cluster (`pipeline/cluster.py`)
3. **metadata.json size** — total output file must stay under 1MB (`pipeline/upload.py` or a validation script)
4. **Film photo fallback** — photos with no EXIF timestamp must be assigned via KNN, not left unclassified (`pipeline/cluster.py`)

## Common Patterns

**Async Testing (React fetch):**
```jsx
it('loads and displays photos from metadata', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ photos: [...], people: [] })
  })
  render(<App />)
  await screen.findByRole('img')
  expect(screen.getAllByRole('img').length).toBeGreaterThan(0)
})
```

**Error Testing (Python):**
```python
def test_raises_on_missing_config():
    with pytest.raises(FileNotFoundError):
        load_config("nonexistent/config.yaml")
```

---

*Testing analysis: 2026-05-16*
