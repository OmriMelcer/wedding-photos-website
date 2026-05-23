# Deferred Items — Phase 10

## Pre-existing Lint Errors (out of scope for Plan 10-01)

These 12 ESLint errors existed before Plan 10-01 execution. Zero new errors were introduced by this plan. Deferred for a future maintenance task.

| File | Line | Error |
|------|------|-------|
| site/tests/useFilters.test.js | 207 | `'global' is not defined` (no-undef) |
| site/tests/usePhotos.test.js | 1 | `'beforeEach' is defined but never used` (no-unused-vars) |
| site/tests/usePhotos.test.js | 52, 64, 77, 88, 104, 121 | `'global' is not defined` (no-undef) |
| site/vite.config.js | 10 | `'__dirname' is not defined` (no-undef) |
| site/worker.js | 17 | `Unnecessary escape character: \-` (no-useless-escape) |

**Verified pre-existing:** confirmed identical errors via `git stash` test before my changes were applied.
