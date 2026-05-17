---
phase: 04-react-site
plan: "02"
subsystem: site/src/hooks
tags: [hooks, fetch, filters, vitest, react, gall-01, filt-01, filt-02, filt-03]
dependency_graph:
  requires:
    - 04-01  # site scaffold with Vite + Tailwind + shadcn + @/config alias
  provides:
    - usePhotos (GALL-01 single-shot fetch hook)
    - useFilters (FILT-01/02/03 in-memory filter state + memoized derivation)
  affects:
    - 04-03  # UI components consume these hooks directly
tech_stack:
  added: []
  patterns:
    - React useState + useEffect for single-shot fetch with loading/error state
    - React useMemo for memoized derived filter arrays (filteredByPhase, flatFilteredPhotos)
    - React useCallback for stable toggle/clearAll handlers
    - vi.spyOn(global, 'fetch') + mockResolvedValue for fetch mocking in Vitest
    - renderHook + waitFor + act from @testing-library/react for hook testing
key_files:
  created:
    - site/src/hooks/usePhotos.js
    - site/src/hooks/useFilters.js
    - site/tests/usePhotos.test.js
    - site/tests/useFilters.test.js
  modified: []
decisions:
  - "usePhotos uses functional setState in catch path (setState(s => ({...s, loading: false, error: err}))) to preserve any in-flight state updates"
  - "useFilters filteredByPhase is built with PHASE_ORDER.reduce to guarantee key order matches timeline regardless of JS object key iteration"
  - "flatFilteredPhotos derives from filteredByPhase via a second useMemo so phase filter changes trigger only one recomputation chain"
  - "Toggle handlers use useCallback with empty deps since they only close over state setters (stable references)"
metrics:
  duration: "~12 minutes"
  completed: "2026-05-17"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 0
---

# Phase 4 Plan 02: usePhotos + useFilters Hooks Summary

**One-liner:** Single-shot metadata fetch hook and memoized in-memory filter hook with full GALL-01/FILT-01-03 test coverage (23 total tests, 16 new).

## What Was Built

### usePhotos (site/src/hooks/usePhotos.js)

Named export `usePhotos()`. Fetches `METADATA_URL` exactly once on mount via an empty-dep `useEffect`. Validates `Array.isArray(data.photos)` and throws a descriptive error if false. Returns `{ photos, people, loading, error }`. The `people` array defaults to `[]` if absent from the response. Error path uses functional setState to preserve state fields atomically.

### useFilters (site/src/hooks/useFilters.js)

Named export `useFilters(photos)`. Maintains two `useState(new Set())` for `selectedPhotographers` and `selectedPhases`. Derives `filteredByPhase` (keyed by phase, each array sorted by `sort_key` asc) and `flatFilteredPhotos` (PHASE_ORDER.flatMap) via two chained `useMemo` calls. Filter semantics: AND across groups, OR within each group; empty Set means "no filter for that group." Toggle handlers (`togglePhotographer`, `togglePhase`) and `clearAll` are stable `useCallback` refs that create new Sets without mutating.

## Test Coverage

| File | Tests | Requirements |
|------|-------|-------------|
| tests/usePhotos.test.js | 6 | GALL-01 |
| tests/useFilters.test.js | 10 | FILT-01, FILT-02, FILT-03, D-09 (AND/OR), GALL-01 integration |

**usePhotos test behaviors covered:**
1. fetch called exactly once on mount with METADATA_URL
2. Success state: photos, people, loading=false, error=null
3. Empty people[] returns [] not undefined
4. HTTP 500 → error.message = "HTTP 500: Internal Server Error"
5. photos='not-an-array' → error.message contains 'photos field is not an array'
6. rerender() does not trigger a second fetch (GALL-01 invariant)

**useFilters test behaviors covered:**
1. Initial empty Sets → all photos per phase, PHASE_ORDER + sort_key ordering
2. Single photographer reduces to that photographer only
3. Multi-photographer OR-within: either photographer included
4. Single phase: only that phase in flatFilteredPhotos
5. Multi-phase OR-within: either phase included
6. AND across groups: abir_sultan + prep → only matching photo (p01)
7. clearAll resets both Sets to size 0, restores unfiltered view
8. Toggle adds then removes on second call
9. flatFilteredPhotos follows PHASE_ORDER then sort_key ascending (verified structurally)
10. Composed with usePhotos: filter toggle does not trigger second fetch (GALL-01 integration)

## Verification Gates Passed

```
npm test -- --run tests/usePhotos.test.js  → 6/6 pass
npm test -- --run tests/useFilters.test.js → 10/10 pass
npm test -- --run                          → 23/23 pass (7 Plan 01 + 16 Plan 02)
grep -c "^\s*it(" tests/usePhotos.test.js  → 6 (≥6 required)
grep -c "^\s*it(" tests/useFilters.test.js → 10 (≥10 required)
grep -q "from '@/config'" src/hooks/usePhotos.js → OK
grep -q "PHASE_ORDER" src/hooks/useFilters.js    → OK
grep -q "useMemo" src/hooks/useFilters.js        → OK
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. Both hooks are fully functional with real filter logic and real fetch behavior. No hardcoded empty values flow to rendering.

## Threat Flags

None. These are pure client-side in-memory hooks with no network surface beyond the existing `fetch(METADATA_URL)` pattern already established in the spec.

## Self-Check: PASSED

- site/src/hooks/usePhotos.js exists: FOUND
- site/src/hooks/useFilters.js exists: FOUND
- site/tests/usePhotos.test.js exists: FOUND
- site/tests/useFilters.test.js exists: FOUND
- Commit c43d4b8 exists: FOUND
- All 23 tests pass: CONFIRMED
