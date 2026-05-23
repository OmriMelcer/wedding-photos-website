# Research Summary: v1.3 Lightbox Zoom

**Milestone:** v1.3 Lightbox Zoom/Pan
**Synthesized:** 2026-05-23
**Overall Confidence:** HIGH

---

## Executive Summary

Adding zoom/pan to the existing wedding photo lightbox is a single-file change to `site/src/components/Lightbox.jsx`. The yarl Zoom plugin ships inside the already-installed `yet-another-react-lightbox@^3.32.0` package — zero new npm dependencies. All three v1.3 requirements (pinch-to-zoom on mobile, scroll-wheel zoom on desktop, drag-to-pan while zoomed) are delivered by importing the bundled plugin and adding it to the `plugins` array alongside the existing `Download` plugin.

The implementation surface is small but contains several non-obvious configuration landmines. Two are critical: `maxZoomPixelRatio` defaults to `1.0`, which silently disables zoom on every retina/mobile device, and the residual-zoom swipe-block bug on iOS (fast pinch-out leaves zoom stuck slightly above 1.0) requires `pinchZoomV4: true` to fix. There is also a genuine disagreement between researchers on `scrollToZoom` that must be resolved before implementation begins.

The test surface is narrow: the existing `Lightbox.test.jsx` needs one new mock and two new assertions. No other component files change.

---

## Key Findings

### From STACK.md

- **Zero new dependencies.** The Zoom plugin is imported from `yet-another-react-lightbox/plugins/zoom` — the same package already installed at `^3.32.0`.
- **No CSS import needed.** Only the Captions, Counter, and Thumbnails plugins require separate CSS; Zoom does not.
- **`pinchZoomV4` is the current way to get the improved pinch implementation.** Introduced in v3.27.0 as experimental; still behind a flag in v3.32.0. Described as "not required but worth enabling" by the Stack researcher.
- **`scrollToZoom` not flagged as controversial by Stack researcher.** STACK.md recommends `scrollToZoom: true` and notes the Inline-plugin page-scroll bleed (issue #248) does not apply to a modal lightbox.
- **Do not add** `react-zoom-pan-pinch`, HammerJS, or any custom gesture library.

### From FEATURES.md

- **Table stakes (all delivered by plugin, zero custom code):** pinch-to-zoom, scroll-wheel zoom (`scrollToZoom: true` required), drag-to-pan, zoom reset on slide change, min zoom locked at 1x, double-tap toggle, navigation disabled while zoomed.
- **Differentiators worth enabling now (low effort):** `maxZoomPixelRatio: 2` to expose full detail on retina screens; `animation.zoom: 300` for snappier feel vs. the 500ms default.
- **Deferred (explicitly out of scope for v1.3):** External +/- toolbar buttons with `zoomRef`, zoom level indicator, server-side image tiling.
- **MVP recommendation:** import, add to plugins, set `zoom={{ scrollToZoom: true, maxZoomPixelRatio: 2, animation: { zoom: 300 } }}`.

### From ARCHITECTURE.md

- **Single file modified:** `site/src/components/Lightbox.jsx`. No changes to `App.jsx`, `Gallery.jsx`, `Filters.jsx`, data flow, metadata schema, or pipeline.
- **Recommended config from Architecture researcher:** `zoom={{ scrollToZoom: true, maxZoomPixelRatio: 2, zoomInMultiplier: 2, doubleClickMaxStops: 2 }}`. Architecture researcher says `scrollToZoom: true` is safe for modal lightbox.
- **Plugin order:** `plugins={[Download, Zoom]}` per Architecture researcher. Pitfalls researcher recommends `plugins={[Zoom, Download]}` for RTL toolbar ordering — see Pitfall 6.
- **Test changes required:** Add `vi.mock('yet-another-react-lightbox/plugins/zoom', ...)` + assert Zoom in plugins + assert `zoom.scrollToZoom === true`.
- **`pinchZoomV4` flagged as "not stable in ^3.32.0, do not set"** by Architecture researcher — direct conflict with PITFALLS.md. See Decision 2.

### From PITFALLS.md

- **Critical Pitfall 1 — `maxZoomPixelRatio` defaults to 1.0:** On any retina/high-DPR device (every modern iPhone, every Retina MacBook), zoom buttons appear greyed out and pinch does nothing. Guests see the UI but it is broken. Set `maxZoomPixelRatio: 2` at minimum; `3` is recommended in yarl examples.
- **Critical Pitfall 2 — residual-zoom swipe block on iOS:** Fast pinch-out leaves zoom slightly above 1.0. Lightbox treats image as still-zoomed, so horizontal swipe triggers pan instead of slide navigation. Guests are stuck. Prevention: `zoom={{ pinchZoomV4: true }}`.
- **Critical Pitfall 3 — `scrollToZoom: true` page scroll bleed:** Pitfalls researcher recommends keeping `scrollToZoom: false` and relying on `Ctrl+wheel`. Conflicts with STACK.md and ARCHITECTURE.md — see Decision 1.
- **Pitfall 5 — arrow keys captured while zoomed:** By design and not configurable (yarl maintainer confirmed in discussion #246). Accept this behavior.
- **Pitfall 6 — toolbar button order in RTL:** Plugin array order determines toolbar button rendering order in RTL. Recommend `plugins={[Zoom, Download]}` and verify visually.
- **Pitfall 9 — Hebrew labels missing for new zoom buttons:** Existing `labels={{ Download: 'הורדה' }}` does not cover the two new tooltip buttons. Without override, tooltips show English while UI is Hebrew. Extend labels to include `"Zoom in": "הגדל"` and `"Zoom out": "הקטן"`.

---

## Implementation-Blocking Decisions

### DECISION 1 (Blocking): scrollToZoom — true or false?

**Conflict:** Stack and Architecture researchers say `scrollToZoom: true` is safe for modal lightbox. Pitfalls researcher says keep it `false` and rely on `Ctrl+wheel`.

| Position | Source | Reasoning |
|----------|--------|-----------|
| `scrollToZoom: true` | STACK.md, ARCHITECTURE.md, FEATURES.md | Modal lightbox captures all wheel events; issue #248 (page scroll bleed) only affects the Inline plugin variant. Plain scroll-wheel zoom is the standard desktop pattern. |
| `scrollToZoom: false` | PITFALLS.md | Core bug is fixed but wheel passive/non-passive split is browser-dependent. Recommends `Ctrl+wheel` as the safer conservative choice. |

**Recommendation:** Set `scrollToZoom: true`. The PITFALLS researcher's concern (issue #248) is explicitly marked released and applies only to Inline-variant lightboxes. This app uses `portal={{ container: ... }}` which is the safe modal configuration. Three of four researchers converge on `true`. If scroll bleed is observed during smoke testing, fall back to `false` — it is a one-line rollback.

**Risk:** LOW. One-line rollback if wrong. Test explicitly during smoke testing.

---

### DECISION 2 (Blocking): pinchZoomV4: true — enable or skip?

**Conflict:** STACK.md says "not required but worth enabling." PITFALLS.md says it is the required fix for the swipe-block bug. ARCHITECTURE.md explicitly says "not stable in ^3.32.0, do not set."

| Position | Source | Reasoning |
|----------|--------|-----------|
| Enable `pinchZoomV4: true` | STACK.md, PITFALLS.md | Fixes the residual-zoom swipe-block bug (Pitfall 2); marked released in v3.27.0+; v3.32.0 is well past that fix. |
| Do not enable | ARCHITECTURE.md | "Experimental replacement, not stable in ^3.32.0." |

**Recommendation:** Enable `pinchZoomV4: true`. The PITFALLS researcher examined the installed TypeScript types directly and the STACK researcher verified release history. The issue it fixes (guests stuck unable to navigate after fast pinch-out) is a user-facing blocker on iPhones — the most common device for wedding guests. The Architecture researcher's caution ("experimental") is based on the flag's v3.27.0 origin, not a specific documented regression in v3.32.0. Validate during iPhone smoke testing; revert if instability is observed.

**Risk:** LOW-MEDIUM. Fixes a critical mobile UX regression; "experimental" label reflects history, not known current bugs.

---

## Implications for Roadmap

### Phase Structure: Single Phase, Linear

This milestone is one phase. The change is contained to one file and one test file. All three ZOOM requirements unlock simultaneously via the same plugin addition.

**Phase 1 — Core Zoom Implementation**

Delivery: Pinch-to-zoom (ZOOM-01), scroll-wheel zoom (ZOOM-02), drag-to-pan (ZOOM-03), correct Hebrew labels, mobile-safe configuration, updated tests.

Steps in order:
1. Add `vi.mock` for Zoom plugin in `Lightbox.test.jsx` (must precede implementation — Vitest hoists mocks before imports)
2. Modify `Lightbox.jsx`: import Zoom, add to plugins array, add zoom config prop, extend labels
3. Add test assertions: Zoom plugin in plugins array, `zoom.scrollToZoom === true`
4. Smoke test: pinch on iPhone, scroll-wheel on desktop, drag-to-pan on both, verify Hebrew tooltips, verify swipe navigation resumes after fast pinch-out

Features delivered: ZOOM-01, ZOOM-02, ZOOM-03
Pitfalls to actively avoid: Pitfall 1 (maxZoomPixelRatio), Pitfall 2 (pinchZoomV4), Pitfall 9 (Hebrew labels), Pitfall 6 (toolbar button order)
Research flags: None — this is a well-documented plugin. Both decisions are resolved above.

---

## Recommended Final Config

```jsx
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

// In LightboxWrapper:
plugins={[Zoom, Download]}
labels={{ Download: 'הורדה', "Zoom in": "הגדל", "Zoom out": "הקטן" }}
zoom={{
  scrollToZoom: true,
  maxZoomPixelRatio: 3,
  pinchZoomV4: true,
  doubleClickMaxStops: 2,
}}
```

Notes:
- `plugins={[Zoom, Download]}` — Zoom before Download so zoom controls appear on the outer end of the RTL toolbar. Verify visually in a running build.
- `maxZoomPixelRatio: 3` — setting this is mandatory; the default (1) silently breaks zoom on retina and mobile devices.
- `pinchZoomV4: true` — prevents residual-zoom swipe-block bug on iPhone (Pitfall 2).
- `scrollToZoom: true` — plain scroll-wheel zoom on desktop; safe for modal lightbox per Decision 1.
- Hebrew labels set on same commit as plugin addition.
- No separate CSS import needed for Zoom.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (zero new deps, import path) | HIGH | Verified against installed package and Context7 docs |
| Features (table stakes, what to defer) | HIGH | Consistent across all researchers |
| Architecture (single-file change, test impact) | HIGH | Well-documented yarl plugin pattern |
| Pitfall 1 (maxZoomPixelRatio default) | HIGH | Confirmed via installed TypeScript types and maintainer discussion |
| Pitfall 2 (pinchZoomV4 / swipe block) | MEDIUM | Issue #380 marked released; fix version inferred from release notes |
| Pitfall 3 (scrollToZoom scroll bleed) | MEDIUM | Issue #248 marked released; browser passive-event behavior not re-verified |
| Pitfall 9 (Hebrew labels) | HIGH | Label keys confirmed against TypeScript Labels interface |

### Gaps

- `scrollToZoom` page-scroll behavior under passive wheel events is not verified against the current browser landscape. Explicit smoke test required.
- `pinchZoomV4` stability on v3.32.0 exactly is not independently confirmed; evidence is inferential from release notes and issue tracker.
- Toolbar button visual order in the RTL portal must be validated in a running build.

---

## Sources (Aggregated)

- Context7 `/igordanchenko/yet-another-react-lightbox` — Zoom plugin props, multi-plugin example (HIGH)
- yet-another-react-lightbox official docs: https://yet-another-react-lightbox.com/plugins/zoom (HIGH)
- GitHub releases (v3.27.0-v3.32.0): https://github.com/igordanchenko/yet-another-react-lightbox/releases (HIGH)
- yarl 3.32.0 TypeScript types: `/site/node_modules/yet-another-react-lightbox/dist/plugins/zoom/index.d.ts` (HIGH)
- Issue #380 (pinch-out residual zoom / swipe blocked): https://github.com/igordanchenko/yet-another-react-lightbox/issues/380 (MEDIUM)
- Issue #248 (scrollToZoom page scroll, Inline plugin): https://github.com/igordanchenko/yet-another-react-lightbox/issues/248 (MEDIUM)
- Discussion #246 (arrow keys not configurable when zoomed): https://github.com/igordanchenko/yet-another-react-lightbox/discussions/246 (HIGH — maintainer response)
- Discussion #9 (zoom buttons disabled at default maxZoomPixelRatio): https://github.com/igordanchenko/yet-another-react-lightbox/discussions/9 (HIGH — maintainer explanation)
