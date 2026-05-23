# Feature Landscape: Lightbox Zoom/Pan

**Domain:** Pinch-to-zoom and scroll-wheel zoom in a photo lightbox
**Library:** yet-another-react-lightbox@^3.32.0 (Zoom plugin, bundled in package)
**Researched:** 2026-05-23
**Confidence:** HIGH (official Context7 docs + GitHub source)

---

## What yarl's Zoom Plugin Provides Out of the Box

The Zoom plugin is bundled inside `yet-another-react-lightbox` — no extra npm install needed. It is activated by importing `Zoom` from `yet-another-react-lightbox/plugins/zoom` and adding it to the `plugins` array.

### Input methods supported (all built-in, zero custom code required)

| Device | Zoom gesture | Pan gesture |
|--------|-------------|-------------|
| Touchscreen (mobile) | Pinch-to-zoom, double-tap to toggle zoom stops | Swipe while zoomed |
| Touchpad (laptop) | Pinch-to-zoom, double-tap, double-click | Two-finger scroll, click-and-drag |
| Mouse (desktop) | Ctrl + scroll wheel, double-click | Scroll wheel, click-and-drag |
| Keyboard | `+` / `-`, `Cmd/Ctrl + =` / `-` / `0` | Arrow keys |

### Navigation lock while zoomed

When the image is zoomed in, **swipe and arrow-key navigation to the next/previous slide is disabled** — they become pan controls instead. This is intentional yarl behavior. Slide navigation resumes only after the user zooms back to 1x.

### Zoom reset on slide change

Zoom level resets to 1x automatically when navigating to a different slide. This is standard yarl behavior (confirmed via community reports and the zoomRef API which exposes per-slide zoom state).

### scroll-to-zoom (`scrollToZoom`)

Off by default. When enabled, the plain scroll wheel zooms the image (not just Ctrl+scroll). For this project (full-screen modal lightbox, not inline), enabling `scrollToZoom: true` is appropriate — the lightbox is the only scrollable target, so page-scroll event bleed is not a concern. The known bug (Issue #248) with page scroll bleed only affects the Inline plugin variant, which this project does not use.

### pinchZoomV4 flag

An experimental opt-in (`pinchZoomV4: true`) for an improved pinch gesture implementation scheduled for v4. The existing pinch behavior (Issue #380 — fast pinch-out causing a brief visual glitch) is fixed in released versions. `pinchZoomV4` is optional and lower-risk than it sounds.

### Default config values

```
minZoom:               1        (cannot zoom below 1x)
maxZoomPixelRatio:     1        (1:1 image pixels at max zoom — limited for high-res photos)
zoomInMultiplier:      2        (each zoom step doubles/halves scale)
doubleClickMaxStops:   2        (double-tap cycles through 2 zoom stops then resets)
keyboardMoveDistance:  50       (px per arrow key press while panning)
wheelZoomDistanceFactor: 100
scrollToZoom:          false    (must be explicitly enabled)
maxZoom:               8        (for custom slide types; image slides use maxZoomPixelRatio)
animation.zoom:        500ms    (built-in smooth CSS transition)
```

---

## Table Stakes

Features users expect in a photo lightbox zoom. Missing = the feature feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| Pinch-to-zoom on mobile | Every photo viewer on mobile supports it; users will try it instinctively | Low | Built into yarl Zoom plugin; zero custom code |
| Scroll-wheel zoom on desktop | Standard pattern across Google Photos, Lightroom, iCloud, etc. | Low | `scrollToZoom: true` required; off by default in yarl |
| Drag to pan while zoomed | Users zoom to find a face or detail — they must be able to pan to it | Low | Built into yarl Zoom plugin; zero custom code |
| Zoom resets on slide change | Navigating to next photo at someone else's zoom level is disorienting | Low | yarl does this automatically; no code needed |
| Min zoom = 1x (no zoom-out below fit) | Zooming below fit is confusing on a darkened lightbox background | Low | yarl default: `minZoom: 1` |
| Double-tap to toggle zoom on mobile | Touch-native pattern; users expect it after zoom is discovered | Low | Built-in; `doubleClickMaxStops: 2` default is correct |
| Navigation disabled while zoomed | Accidental swipe-to-next while panning is extremely frustrating | Low | yarl Zoom plugin handles this automatically |

## Differentiators

Features that would be valued but are not expected.

| Feature | Value Proposition | Complexity | Notes |
|---------|------------------|------------|-------|
| `maxZoomPixelRatio: 2` (or higher) | Photos are served up to 2000px wide; default 1:1 pixel ratio allows zooming to actual resolution, which reveals full detail on Retina screens | Low | Change one config value; `maxZoomPixelRatio: 2` allows 2x physical pixel zoom |
| External zoom +/- buttons in toolbar | Accessibility improvement; users who don't know gesture shortcuts benefit | Medium | Requires `zoomRef`, custom toolbar button components, and RTL-aware positioning |
| `animation.zoom: 300` (faster than default 500ms) | Snappier feel; 500ms default feels slightly sluggish for a toggle gesture | Low | Change one config value |
| Zoom level indicator (e.g., "2x") | Power-user feature; helps users know where they are in zoom range | Medium | Requires `on.zoom` callback + overlay UI component |

## Anti-Features

Features to explicitly NOT build for this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|-------------|-----------|-------------------|
| Custom zoom gesture implementation (raw touch events, Hammer.js) | yarl's Zoom plugin already handles all input methods correctly, including edge cases like pinch conflict resolution and offset clamping | Use the bundled plugin |
| Zoom state persisting across slide navigation | Disorienting — each photo has a different composition, different region of interest | Let yarl reset to 1x on navigate (default) |
| Zoom on thumbnail/gallery grid | Thumbnails are for browsing, not reading detail; zoom belongs in the lightbox only | No change to Gallery.jsx |
| Server-side image tiling for deep zoom | Overkill at 2000px max resolution; adds backend complexity incompatible with static-only architecture | Rely on already-uploaded full-resolution images |
| Dedicated zoom UI buttons in the toolbar (v1.3) | Adds Medium complexity for marginal gain; gesture-only covers 99% of users | Defer to v2 if requested |

---

## Feature Dependencies

```
ZOOM-01 (pinch-to-zoom on mobile)
  → Requires: import Zoom from 'yet-another-react-lightbox/plugins/zoom'
  → Requires: Zoom added to plugins={[Download, Zoom]}
  → No other dependencies

ZOOM-02 (scroll-wheel zoom on desktop)
  → Requires: ZOOM-01 (same plugin instance)
  → Requires: zoom={{ scrollToZoom: true }}

ZOOM-03 (drag to pan while zoomed)
  → Requires: ZOOM-01 (built in — activates automatically once Zoom plugin is present)
  → No additional config

All three ZOOM features share a single code change: adding Zoom to the plugins array in Lightbox.jsx.
```

---

## MVP Recommendation

All three requirements (ZOOM-01, ZOOM-02, ZOOM-03) are delivered by a single plugin addition. The entire implementation in `Lightbox.jsx` is:

1. Add `import Zoom from 'yet-another-react-lightbox/plugins/zoom'`
2. Add `Zoom` to `plugins={[Download, Zoom]}`
3. Add `zoom={{ scrollToZoom: true, maxZoomPixelRatio: 2, animation: { zoom: 300 } }}`

Recommended config for v1.3:
- `scrollToZoom: true` — enables desktop scroll-wheel zoom (not the default)
- `maxZoomPixelRatio: 2` — allows zooming to actual pixel resolution on modern screens; photos are served up to 2000px
- Keep all other settings at their defaults

Defer: External +/- toolbar buttons — Medium complexity, zero user demand signal, easy to add in a later milestone.

---

## Interaction with Existing Code

- `Lightbox.jsx` already uses `plugins={[Download]}`. Adding `Zoom` to the array is the only required change.
- The `portal={{ container: { dir: 'rtl' } }}` prop already in place is compatible with Zoom — no conflict.
- The Download plugin and Zoom plugin are independent; they share the toolbar area but do not conflict.
- The `download={{ download: ... }}` handler is unaffected.
- No changes to `App.jsx`, `Gallery.jsx`, `Filters.jsx`, or any other component.

---

## Sources

- Context7 / yarl official docs: https://github.com/igordanchenko/yet-another-react-lightbox/blob/main/docs/plugins/zoom.md (HIGH confidence)
- Context7 resolved library: `/igordanchenko/yet-another-react-lightbox`
- Known issue (pinch zoom-out glitch, resolved): https://github.com/igordanchenko/yet-another-react-lightbox/issues/380
- Known issue (scrollToZoom page bleed, Inline only, resolved): https://github.com/igordanchenko/yet-another-react-lightbox/issues/248
- Navigation-while-zoomed behavior: https://github.com/igordanchenko/yet-another-react-lightbox/discussions/246
