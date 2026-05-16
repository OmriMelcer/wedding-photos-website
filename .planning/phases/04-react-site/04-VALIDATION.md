---
phase: 4
slug: react-site
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-16
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | site/vite.config.js (test section) |
| **Quick run command** | `cd site && npm test -- --run` |
| **Full suite command** | `cd site && npm test -- --run --coverage` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd site && npm test -- --run`
- **After every plan wave:** Run `cd site && npm test -- --run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | GALL-01 | — | N/A | unit | `cd site && npm test -- --run` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | GALL-02 | — | N/A | unit | `cd site && npm test -- --run` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | GALL-03 | — | N/A | unit | `cd site && npm test -- --run` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | FILT-01 | — | N/A | unit | `cd site && npm test -- --run` | ❌ W0 | ⬜ pending |
| 04-01-05 | 01 | 1 | FILT-02 | — | N/A | unit | `cd site && npm test -- --run` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | DSGN-01 | — | N/A | visual | manual | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | I18N-01 | — | N/A | unit | `cd site && npm test -- --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `site/src/__tests__/App.test.jsx` — stubs for GALL-01, FILT-01
- [ ] `site/src/__tests__/Gallery.test.jsx` — stubs for GALL-02, GALL-03
- [ ] `site/src/__tests__/Filters.test.jsx` — stubs for FILT-02, FILT-03, FILT-04
- [ ] `site/src/__tests__/i18n.test.js` — stubs for I18N-01, I18N-02
- [ ] `vitest` and `@testing-library/react` — Wave 0 installs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| RTL layout renders correctly in Hebrew | I18N-01 | Visual inspection required | Open site in browser, verify text flows right-to-left, no UI breakage |
| Masonry grid responsive at 375px, 768px, 1280px | GALL-02 | Visual layout check | Use browser devtools responsive mode at each breakpoint |
| Lightbox previous/next navigation through filtered set | GALL-04 | User interaction flow | Click photo, navigate with arrows, verify stays within filtered subset |
| Face filter absent when people.length === 0 | FILT-04 | Conditional UI behavior | Load with empty people[] fixture, inspect DOM for face filter absence |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
