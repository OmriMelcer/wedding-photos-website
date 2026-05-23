# Technology Stack — v1.3 Lightbox Zoom

**Project:** Wedding Photo Album — zoom/pan milestone
**Researched:** 2026-05-23
**Scope:** New dependencies and configuration changes only. Existing stack (yarl ^3.32.0, React 19, Vite, Tailwind v4) is not re-evaluated here.

---

## Decision: Zero New Dependencies

The yarl Zoom plugin ships inside the existing `yet-another-react-lightbox` package. No npm installs required.

**Confidence:** HIGH — verified against Context7 docs and yarl official docs. The plugin is imported from `yet-another-react-lightbox/plugins/zoom`, same pattern as the already-installed Download plugin.

---

## What the Zoom Plugin Covers

All three v1.3 requirements are handled by the built-in Zoom plugin:

| Requirement | Mechanism | Config required |
|-------------|-----------|-----------------|
| ZOOM-01: Pinch-to-zoom (mobile) | Native touch pinch gesture handler built into plugin | None (on by default) |
| ZOOM-02: Scroll-wheel zoom (desktop) | Mouse wheel zoom | `scrollToZoom: true` (defaults to `false`) |
| ZOOM-03: Drag-to-pan while zoomed | Click-and-drag on desktop; swipe on touch while zoomed | None (on by default) |

Source: [yarl Zoom plugin docs](https://github.com/igordanchenko/yet-another-react-lightbox/blob/main/docs/plugins/zoom.md), Context7 `/igordanchenko/yet-another-react-lightbox`

---

## Current Version Status

The project already runs `yet-another-react-lightbox@^3.32.0`, which is the latest release as of 2026-05-23. No version bump needed.

Notable zoom-related releases in recent history:
- **v3.27.0** (Dec 2025): Experimental pinch zoom implementation (`pinchZoomV4` flag) + improved pinch accuracy
- **v3.31.0** (Apr 2026): Zoom on custom slide types
- **v3.32.0** (May 2026): Bug fixes, keyboard event handling (current)

A previous pinch-to-zoom zoom-out bug (issue #380 — fast pinch-out overshooting) was marked released before v3.32.0.

---

## Integration Points

### Import Addition

```js
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
// No additional CSS import needed for Zoom (unlike Thumbnails/Captions)
```

### Plugin Array

Add `Zoom` to the existing `plugins` prop alongside `Download`. Order does not matter between these two.

```jsx
plugins={[Download, Zoom]}
```

### Zoom Config

```jsx
zoom={{
  scrollToZoom: true,          // REQUIRED: enables mouse scroll wheel zoom (defaults false)
  maxZoomPixelRatio: 3,        // recommended: allow 3x native pixel zoom for detail inspection
  doubleClickMaxStops: 2,      // double-click zooms in 2 stops before resetting
}}
```

`pinchZoomV4` is an experimental flag introduced in v3.27.0 for an improved pinch implementation. It is not required but worth enabling if the default pinch behavior feels sluggish on test devices:

```jsx
zoom={{ scrollToZoom: true, maxZoomPixelRatio: 3, pinchZoomV4: true }}
```

### No Additional CSS

The Zoom plugin does not require a separate CSS file import (confirmed: only Captions, Counter, Thumbnails plugins have separate CSS).

---

## Known Caveats

### scrollToZoom + Inline plugin conflict (NOT applicable here)

Issue #248 documented that `scrollToZoom: true` caused page scroll bleed-through when using the **Inline** plugin (lightbox embedded in a scrollable page). This project uses a **modal** lightbox (`open={true}`), so wheel events are captured inside the modal overlay and page scroll is not accessible. This conflict does not apply.

### Pinch-zoom at max zoom boundary (resolved)

Issue #380: fast pinch-out at zoom=1 briefly snapped to a non-zero zoom state before resetting. Marked released before the current v3.32.0. No workaround needed.

### RTL layout interaction

The existing `portal={{ container: { dir: 'rtl' } }}` prop is unchanged. Zoom plugin operates on the image layer, not the navigation/toolbar layer, so RTL direction does not affect zoom/pan behavior.

---

## What NOT to Add

| Temptation | Why not |
|------------|---------|
| `react-zoom-pan-pinch` | Third-party zoom lib; redundant — yarl Zoom covers all three gestures natively |
| `hammerjs` / gesture library | yarl handles its own touch events; adding another gesture library risks conflicts |
| `yet-another-react-lightbox` version bump | Already on latest (3.32.0); do not bump |
| Zoom toolbar buttons (ZoomIn/ZoomOut) | Not requested in v1.3 requirements; adds UI clutter; defer to user feedback |

---

## Sources

- Context7 `/igordanchenko/yet-another-react-lightbox` — Zoom plugin props, multi-plugin example (HIGH confidence)
- [yet-another-react-lightbox Zoom plugin docs](https://yet-another-react-lightbox.com/plugins/zoom) (HIGH confidence)
- [GitHub releases](https://github.com/igordanchenko/yet-another-react-lightbox/releases) — version history, v3.32.0 latest (HIGH confidence)
- [Issue #248 scrollToZoom](https://github.com/igordanchenko/yet-another-react-lightbox/issues/248) — Inline plugin conflict, marked released (MEDIUM confidence — resolution details unspecified)
- [Issue #380 pinch behavior](https://github.com/igordanchenko/yet-another-react-lightbox/issues/380) — pinch-out overshoot, marked released (MEDIUM confidence)
