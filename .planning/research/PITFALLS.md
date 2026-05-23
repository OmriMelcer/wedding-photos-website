# Domain Pitfalls: Adding Zoom to yarl (v3.32.0)

**Domain:** Adding pinch-to-zoom + scroll-wheel zoom + drag-to-pan to an existing yarl lightbox in a Hebrew RTL React 19 app
**Researched:** 2026-05-23
**Context:** Existing system has yarl 3.32.0 with Download plugin, portal RTL (`dir: "rtl"`), and a custom download handler.

---

## Critical Pitfalls

### Pitfall 1: Zoom Silently Disabled Because maxZoomPixelRatio Defaults to 1.0

**What goes wrong:** The default `maxZoomPixelRatio` is `1.0`, meaning the maximum zoom level is calculated as the ratio of image pixels to physical (CSS) pixels. On a retina display (2x DPR) a 2000px-wide image displayed at 1000px CSS width is already shown at 2× physical pixels, so the computed max zoom is effectively 1.0. The "Zoom In" button renders as disabled and pinch gestures do nothing. Guests see zoom controls but they are greyed out and unresponsive.

**Why it happens:** The plugin computes `maxZoom = imageWidth / (viewportWidth * devicePixelRatio) * maxZoomPixelRatio`. When `maxZoomPixelRatio = 1`, on a retina Mac or modern iPhone, the images (capped at 2000px by the pipeline) may fill the lightbox at or beyond 1:1 pixel ratio, leaving no headroom for zoom.

**Consequences:** Feature appears to ship but does nothing on any high-DPR device. Guests on iPhones see disabled zoom buttons. Pinch gesture is silently ignored.

**Prevention:** Set `zoom={{ maxZoomPixelRatio: 2 }}` as a minimum. For 2000px pipeline output images, `maxZoomPixelRatio: 2` gives 2× zoom on a 1x display and meaningful zoom on retina. `maxZoomPixelRatio: 3` is the recommended default in the yarl examples. Do NOT leave this at the library default.

**Detection:** Open the lightbox on an iPhone or retina MacBook. Zoom In button is greyed. Pinch gesture triggers slide navigation instead of zoom.

---

### Pitfall 2: Fast Pinch-Out Leaves Zoom in Residual State, Blocking Swipe Navigation

**What goes wrong:** When a user pinches out quickly on mobile (especially iPhone), the image zooms fully out but then slightly bounces back to a zoom level just above 1.0. The lightbox thinks the image is still zoomed, so horizontal swipe gestures are intercepted for pan instead of triggering slide navigation. Guests are stuck: they can no longer swipe to the next photo.

**Why it happens:** The pinch event stream ends with a small opposite-direction delta. The zoom implementation processes this as a zoom-in event after the zoom-out, leaving a residual zoom level above `minZoom`. The library's gesture router uses zoom level to decide whether swipes are pan vs navigate.

**Consequences:** Guests are stuck on a single photo mid-zoom with no intuitive way out. The fix is to pinch again or double-tap to fully zoom out — neither is discoverable.

**Status:** Filed as issue #380, marked released. Verified resolved in yarl 3.27.0+ which introduced `pinchZoomV4`. In yarl 3.32.0 (current), use `zoom={{ pinchZoomV4: true }}` to enable the improved pinch implementation. The old implementation (`pinchZoomV4` absent or false) still has this bug.

**Prevention:** Add `zoom={{ pinchZoomV4: true }}` to the zoom config. This flag enables the v4 pinch gesture implementation that correctly settles at `minZoom` on a full pinch-out.

**Detection:** On iPhone Safari, zoom in, then pinch out fast. If navigation by swipe doesn't immediately work afterward, the old implementation is active.

---

### Pitfall 3: scrollToZoom: true Causes Unintended Page Scroll on Non-Portal Layouts

**What goes wrong:** With `scrollToZoom: true`, the mouse wheel zooms the image — but if the lightbox portal is not correctly capturing all wheel events, the wheel scroll also propagates to the page behind the overlay, causing the page to scroll.

**Why it happens:** Wheel event propagation is not cancelled unless the lightbox overlay fully captures the event. This was filed as issue #248 (marked released/fixed), but the scrolling behavior depends on portal containment and browser wheel event passive/non-passive split.

**Consequences:** On desktop with `scrollToZoom: true`, the page scrolls while the user tries to zoom. Disorienting in an RTL layout because the page may jump while the lightbox is open.

**Status:** Core bug was fixed in the library. The existing code uses `portal={{ container: { dir: 'rtl' } }}` which renders into a portal div — this is the safer configuration. Risks are lower with a portal lightbox than an inline one.

**Prevention:** Keep `scrollToZoom: false` (the default). Deliver scroll-wheel zoom only via the documented mouse default: `Ctrl + wheel` zooms, plain wheel pans when already zoomed. This is standard desktop photo viewer behaviour. If you do need `scrollToZoom: true`, verify on a page with scrollable content behind the lightbox.

**Detection:** Open lightbox, scroll wheel over the image without Ctrl held. If the lightbox closes and the page has scrolled, propagation is leaking.

---

## Moderate Pitfalls

### Pitfall 4: RTL dir on Portal Does Not Affect Zoom Pan Direction

**What goes wrong:** The existing code correctly passes `portal={{ container: { dir: 'rtl' } }}`. This makes swipe navigation go right-to-left correctly. However, the zoom plugin's pan gestures (drag, arrow keys) operate in CSS transform space, not in document flow direction. Pan direction is geometry-based, not RTL-aware. Dragging right moves the image right regardless of `dir`.

**Why it happens:** CSS `transform: translate(x, y)` is always LTR in coordinate space. The zoom plugin applies pixel offsets directly. There is no documented RTL-flip for pan direction.

**Consequences:** No breaking bug — pan simply works as expected geometrically. The pitfall is assuming RTL somehow inverts drag direction (it doesn't, and shouldn't). Arrow key pan also remains: left arrow moves image left, right arrow moves image right — which is correct and intuitive in both LTR and RTL contexts.

**Prevention:** Do not attempt to invert pan direction for RTL. Accept geometric pan as-is. Test on RTL layout to confirm nothing is backwards.

---

### Pitfall 5: Arrow Key Navigation is Captured by Zoom When Image is Zoomed In

**What goes wrong:** When an image is zoomed in, the left/right arrow keys pan the image instead of navigating to the previous/next slide. This is by design and not configurable (yarl discussion #246: maintainer confirmed "No, I'm afraid this is not supported" when asked to change this).

**Why it happens:** The zoom plugin intercepts arrow key events at a higher priority when `zoom > minZoom`. There is no prop to change this routing.

**Consequences:** Power users who keyboard-navigate the gallery will find arrow navigation blocked while zoomed. They must zoom out (double-click, double-tap, or zoom-out button) before navigating. Not a regression — the gallery currently has keyboard navigation — but it becomes a non-obvious UX change after zoom is added.

**Prevention:** Accept the behavior. Ensure guests have a visible zoom-out button (the plugin adds one by default). Consider adding `labels={{ "Zoom out": "הקטן" }}` so the button is labeled in Hebrew. Do not attempt to override arrow key behaviour with custom event handlers — it conflicts with the plugin's internal state machine.

---

### Pitfall 6: Plugin Order Controls Toolbar Button Ordering

**What goes wrong:** The `plugins` array order determines the order toolbar buttons are prepended. With `plugins={[Download]}` currently, the Download button sits at the left of the toolbar (in RTL: the far right). Adding `plugins={[Download, Zoom]}` prepends both in that order; `plugins={[Zoom, Download]}` puts Zoom first.

**Why it matters:** In an RTL toolbar, button order reads differently to guests. Zoom in/out buttons and Download button may appear in a counter-intuitive order depending on array order.

**Prevention:** Choose the order intentionally. A reasonable default for RTL is `plugins={[Zoom, Download]}` which results in Zoom controls on the outer end and Download near center, but validate visually. The library also exposes `render.buttonZoom` and `toolbar.buttons` for precise ordering control if the default is not acceptable.

---

### Pitfall 7: Deprecated Props Will Emit Warnings or Silently No-Op

**What goes wrong:** Three zoom props are marked `@deprecated` in the 3.32.0 TypeScript types: `doubleTapDelay`, `doubleClickDelay`, and `pinchZoomDistanceFactor`. Using them produces no runtime error but may no longer affect behaviour (silently ignored).

**Prevention:** Do not use `doubleTapDelay`, `doubleClickDelay`, or `pinchZoomDistanceFactor` in the zoom config. Use `doubleClickMaxStops` to control double-tap/click zoom stops. Use `wheelZoomDistanceFactor` for scroll sensitivity.

---

## Minor Pitfalls

### Pitfall 8: Zoom State Does Not Reset Between Slides by Default

**What goes wrong:** If a user zooms into slide 3, then navigates to slide 4, the zoom level persists briefly during the slide transition. The new slide appears zoomed in until the animation resolves the zoom state. On fast navigation this can look glitchy.

**Why it happens:** Zoom state is held in the plugin's internal ref, not per-slide. Slide change triggers a zoom reset animation but the transition and zoom animation overlap.

**Prevention:** Use `animation={{ zoom: 300 }}` (or lower) to speed up the zoom reset, minimising the glitch window. The default is 500ms which is long enough to notice. No API to disable zoom carryover entirely — the reset is automatic but animated.

---

### Pitfall 9: Hebrew Labels Not Set for New Zoom Buttons

**What goes wrong:** The existing lightbox sets `labels={{ Download: 'הורדה' }}` but the zoom plugin adds two new tooltip labels: `"Zoom in"` and `"Zoom out"`. Without overriding these, the toolbar shows English tooltips on hover while the rest of the UI is in Hebrew.

**Prevention:** Add `labels={{ "Zoom in": "הגדל", "Zoom out": "הקטן" }}` to the existing `labels` prop. The label keys are the English strings (including the space) exactly as typed in the TypeScript `Labels` interface.

---

### Pitfall 10: zoom={{ ... }} Object Spread Overwrites Existing Zoom State

**What goes wrong:** If any consumer of the `zoomRef` (e.g., a zoom indicator component) passes a partial `zoom={{ ref: zoomRef }}` and the Lightbox component merges props, a full object spread might accidentally omit `scrollToZoom`, `maxZoomPixelRatio`, or other required overrides.

**Prevention:** Always assemble the full `zoom` config object in one place (inside `LightboxWrapper`) rather than spreading from multiple call sites. The existing pattern of a single `LightboxWrapper` component in `Lightbox.jsx` is the correct place for this.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Initial Zoom plugin integration | Zoom buttons greyed out on all devices (Pitfall 1) | Set `maxZoomPixelRatio: 2` or higher immediately |
| Mobile pinch testing on iPhone | Stuck after fast pinch-out (Pitfall 2) | Add `pinchZoomV4: true` from the start |
| Desktop scroll-wheel zoom | Page scrolling behind lightbox (Pitfall 3) | Keep `scrollToZoom: false`; rely on Ctrl+wheel default |
| Toolbar button layout in RTL | Button order visually wrong (Pitfall 6) | Set `plugins={[Zoom, Download]}` and verify visually |
| Hebrew UI consistency | English "Zoom in" / "Zoom out" tooltips (Pitfall 9) | Set labels on same commit as plugin addition |

---

## Sources

- yarl 3.32.0 TypeScript type definitions: `/site/node_modules/yet-another-react-lightbox/dist/plugins/zoom/index.d.ts` (HIGH confidence — installed source)
- Official zoom plugin documentation: https://yet-another-react-lightbox.com/plugins/zoom (HIGH confidence)
- Context7 yarl docs: https://context7.com/igordanchenko/yet-another-react-lightbox (HIGH confidence)
- GitHub issue #380 (pinch-out zoom residual / swipe blocked): https://github.com/igordanchenko/yet-another-react-lightbox/issues/380 (MEDIUM confidence — marked released, fix version inferred)
- GitHub issue #248 (scrollToZoom page scroll): https://github.com/igordanchenko/yet-another-react-lightbox/issues/248 (MEDIUM confidence — marked released)
- GitHub discussion #246 (arrow key navigation not overridable): https://github.com/igordanchenko/yet-another-react-lightbox/discussions/246 (HIGH confidence — maintainer response)
- GitHub discussion #9 (zoom buttons disabled): https://github.com/igordanchenko/yet-another-react-lightbox/discussions/9 (HIGH confidence — maintainer explanation)
- GitHub releases page: https://github.com/igordanchenko/yet-another-react-lightbox/releases (MEDIUM confidence — release notes consulted)
