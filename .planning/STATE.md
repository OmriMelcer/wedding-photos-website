---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Downloads & Album Links
status: complete
last_updated: "2026-05-23T20:00:00.000Z"
last_activity: 2026-05-23 -- v1.2 shipped and verified live; post-deploy fixes applied
progress:
  total_phases: 1
  completed_phases: 1
  total_plans: 3
  completed_plans: 3
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-18)

**Core value:** Every guest can find and view every photo from the wedding, filtered by who shot it and when it happened — with zero hosting costs and no maintenance burden.
**Current focus:** v1.2 complete — ready for milestone close

## Current Position

Phase: 9 (Downloads & Album Links)
Plan: — (all complete)
Status: Shipped ✓
Last activity: 2026-05-23 -- v1.2 live at wedding-album.omelcer.workers.dev

Progress: [██████████] 100%

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
