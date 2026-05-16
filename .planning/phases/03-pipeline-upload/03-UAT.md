---
status: complete
phase: 03-pipeline-upload
source: 03-01-SUMMARY.md, 03-02-SUMMARY.md
started: 2026-05-16T18:35:00Z
updated: 2026-05-16T18:40:00Z
---

## Current Test

[testing complete]

## Tests

### 1. R2 config block structure
expected: Run `uv run python -c "import yaml; c = yaml.safe_load(open('pipeline/config.yaml')); print(list(c['r2'].keys()))"` — output shows bucket, endpoint, r2_public_url at top level
result: pass

### 2. boto3 importable
expected: Run `uv run python -c "import boto3; print(boto3.__version__)"` — prints a version string (1.35+) and exits 0
result: pass

### 3. boto3 in production dependencies
expected: Run `grep boto3 pyproject.toml` — shows boto3>=1.35.0 in [project] dependencies section, NOT in [dependency-groups]
result: pass

### 4. upload.py parses and has entry point
expected: `ast.parse` succeeds; `grep "if __name__"` returns entry point line
result: pass

### 5. Missing credentials: clean error (not crash)
expected: Script exits non-zero and prints a readable message mentioning R2_ACCESS_KEY_ID. No unhandled exception.
result: pass

### 6. Missing metadata.json: clean error (not crash)
expected: When metadata.json absent, exits non-zero with a message directing operator to run cluster.py + resize.py first. No unhandled exception.
result: issue
reported: "pipeline/output/metadata.json already exists (from Phase 2). With real pipeline outputs and fake credentials, the script gets past all guards and crashes at _make_s3_client with an unhandled ValueError from boto3: 'Invalid endpoint: https://ACCOUNT_ID.r2.cloudflarestorage.com'. No clean error message."
severity: major
fixed: "abab8f8 — catch ValueError in _make_s3_client, print clean error and sys.exit(1). Verified: now exits with readable message."

### 7. URL construction uses photo id not filename
expected: r2_url and thumb_url built from photo["id"], not photo["filename"]
result: pass

### 8. sort_key preserved (not stripped)
expected: No `del photo` or `pop.*sort_key` in the script
result: pass

## Summary

total: 8
passed: 7
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Running upload.py with placeholder config (endpoint=ACCOUNT_ID placeholder) exits non-zero with a readable error message rather than an unhandled Python exception"
  status: failed
  reason: "User reported: pipeline/output/metadata.json already exists from Phase 2. With real pipeline outputs and fake credentials, the script crashes at _make_s3_client with unhandled ValueError from boto3: 'Invalid endpoint: https://ACCOUNT_ID.r2.cloudflarestorage.com'. No clean error message."
  severity: major
  test: 6
  root_cause: "_make_s3_client() passed the placeholder endpoint URL to boto3.client() without catching the ValueError boto3 raises for invalid URLs. Fix: wrap boto3.client() call in try/except ValueError with a clean sys.exit(1) message."
  artifacts:
    - path: "pipeline/upload.py"
      issue: "_make_s3_client() lacked try/except around boto3.client() — ValueError propagated as unhandled exception"
  missing:
    - "except ValueError block in _make_s3_client() — added in fix commit abab8f8"
  debug_session: ""
