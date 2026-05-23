---
gsd_state_version: 1.0
milestone: v1.3
milestone_name: Lightbox Zoom
status: planning
last_updated: "2026-05-23T17:02:40.779Z"
last_activity: 2026-05-23
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-18)

**Core value:** Every guest can find and view every photo from the wedding, filtered by who shot it and when it happened — with zero hosting costs and no maintenance burden.
**Current focus:** v1.2 archived — planning next milestone

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-05-23 — Milestone v1.3 started

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

### Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Face recognition | FACE-01 through FACE-04 | v2 scope | Initialization |
| WAF rate limiting | CF-03 | Descoped permanently | v1.1 (free tier limitation) |

### Phase 9 Notes

- All 5 requirements delivered as pure frontend changes to `site/src/`
- Downloads proxy through `/api/download` Worker route (not direct R2 fetch) — browser `download` attribute is silently ignored for cross-origin URLs; Worker adds `Content-Disposition: attachment`
- Album URLs and labels live in `site/src/config.js` (CONF-01); labels: אביר סולטן, ענבל זלדין, מגנטים, פילם
- `site/public/metadata.json` holds the real 1309-photo dataset (served at `/metadata.json`; no `VITE_METADATA_URL` env var needed)
