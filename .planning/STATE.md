---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Downloads & Album Links
status: planning
last_updated: "2026-05-18T00:00:00.000Z"
last_activity: 2026-05-18
progress:
  total_phases: 1
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-18)

**Core value:** Every guest can find and view every photo from the wedding, filtered by who shot it and when it happened — with zero hosting costs and no maintenance burden.
**Current focus:** Phase 9 — Downloads & Album Links

## Current Position

Phase: 9 (Downloads & Album Links)
Plan: —
Status: Roadmap created; ready for planning
Last activity: 2026-05-18 — v1.2 roadmap created (Phase 9)

Progress: [░░░░░░░░░░] 0% — Phase 9 not started

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

### Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Face recognition | FACE-01 through FACE-04 | v2 scope | Initialization |
| WAF rate limiting | CF-03 | Descoped permanently | v1.1 (free tier limitation) |

### Phase 9 Notes

- All 5 requirements are pure frontend changes to `site/src/`
- Download uses the R2 URL already present in `metadata.json` (r2_url field) — no pipeline changes needed
- Album URLs go into `site/src/config.js` (already exists; holds PHASE_LABELS and VITE_METADATA_URL pattern)
- Lightbox component (`site/src/Lightbox.jsx`) needs download button
- Gallery card component needs hover download icon
- Top bar (App.jsx or dedicated TopBar component) needs 4 album link buttons on the left side
