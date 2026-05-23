# Architecture Patterns: yarl Zoom Plugin Integration

**Domain:** Adding zoom/pan to yet-another-react-lightbox in an existing React 19 + Vite app
**Researched:** 2026-05-23
**Confidence:** HIGH — sourced from Context7/official yarl docs + direct source review

---

## How the Zoom Plugin Works

### What it adds out of the box

The Zoom plugin (`yet-another-react-lightbox/plugins/zoom`) augments the existing lightbox with:

- **Mobile (touchscreen):** pinch-to-zoom, double-tap to zoom in, swipe to pan while zoomed
- **Desktop (mouse):** Ctrl+wheel to zoom, double-click to zoom in, click-and-drag to pan
- **Trackpad:** pinch-to-zoom, two-finger scroll to pan, double-click to zoom
- **Keyboard:** `+`/`-` keys or Cmd/Ctrl+`=`/`-` to zoom, arrow keys to pan while zoomed

Scroll-wheel zoom on desktop (without holding Ctrl) requires explicitly setting `scrollToZoom: true`. The default is `false` — bare scroll wheel is NOT zoom without that opt-in.

### Swipe-to-navigate vs drag-to-pan: how the conflict is resolved

The zoom plugin resolves this **automatically and internally**. When `zoom > 1`:
- Touch swipe becomes pan (moves within the zoomed image), NOT slide navigation
- Arrow keys become pan controls, NOT slide navigation (confirmed authoritative: this is not configurable — see [yarl discussion #246](https://github.com/igordanchenko/yet-another-react-lightbox/discussions/246))
- When zoom returns to `1`, swipe and arrow keys revert to slide navigation

**No custom code is needed** to lock/unlock navigation at zoom=1 threshold. This is built into the plugin. The `controller.disableSwipeNavigation` prop exists on the base lightbox but is not needed here — the Zoom plugin manages that state internally per zoom level.

**Confirmed bug (fixed):** In older builds, fast pinch-out could leave zoom slightly above 1.0 and prevent swipe navigation from resuming. Issue #380 is closed/released as fixed in the installed version range (^3.32.0 is well past that fix).

### No extra CSS imports needed

The zoom plugin has no separate CSS file. The existing import `'yet-another-react-lightbox/styles.css'` (already present in `Lightbox.jsx`) covers everything.

---

## Integration Points

### File modified: `site/src/components/Lightbox.jsx`

This is the **only file that changes**. No new components. No changes to `App.jsx`, `Gallery.jsx`, `Filters.jsx`, or any data flow.

**Three changes to make:**

1. Add import: `import Zoom from 'yet-another-react-lightbox/plugins/zoom';`
2. Add `Zoom` to the `plugins` array alongside the existing `Download`
3. Add a `zoom` config prop with `scrollToZoom: true`

**Resulting component structure:**

```jsx
import YarlLightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Download from 'yet-another-react-lightbox/plugins/download';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import { downloadFile } from '@/utils/download';

export default function LightboxWrapper({ open, index, slides, onClose }) {
  const yarlSlides = slides.map(photo => ({
    src: photo.r2_url,
    alt: photo.id,
    download: { url: photo.r2_url, filename: photo.filename },
  }));

  return (
    <YarlLightbox
      open={open}
      close={onClose}
      slides={yarlSlides}
      index={index}
      portal={{ container: { dir: 'rtl' } }}
      plugins={[Download, Zoom]}
      labels={{ Download: 'הורדה' }}
      download={{ download: ({ slide }) => downloadFile(slide.download.url, slide.download.filename) }}
      zoom={{ scrollToZoom: true }}
    />
  );
}
```

### Plugin ordering in the array

`[Download, Zoom]` — order does not matter for these two plugins; they operate on different interaction surfaces (toolbar button vs gesture/scroll handling).

---

## Props and Configuration

### Minimum required config

```js
zoom={{ scrollToZoom: true }}
```

This single option enables scroll-wheel zoom on desktop (the default is `false`). Pinch-to-zoom and drag-to-pan work without any config.

### Recommended production config

```js
zoom={{
  scrollToZoom: true,      // desktop scroll-wheel zoom (ZOOM-02)
  maxZoomPixelRatio: 2,    // zoom up to 2× the image's natural pixel density
  zoomInMultiplier: 2,     // each step doubles the zoom level
  doubleClickMaxStops: 2,  // double-click/tap zooms through 2 stops before resetting
}}
```

**`maxZoomPixelRatio` rationale:** The default is `1`, which means the maximum zoom stops exactly at the image's natural resolution (no upscaling). `2` allows zooming into fine detail on high-DPI images such as wedding portraits. Going higher starts showing pixel artifacts; 2–3 is the sweet spot for photo viewing.

### What NOT to set

- Do not set `pinchZoomDistanceFactor` — deprecated; `pinchZoomV4: true` is the experimental replacement but it is not stable in ^3.32.0.
- Do not set `doubleTapDelay` / `doubleClickDelay` — deprecated.
- Do not set `ref` (ZoomRef) unless external zoom buttons are needed in the UI. This milestone has no such UI requirement.
- Do not set `controller.disableSwipeNavigation` — handled internally by the plugin.

---

## Data Flow: What Changes

Nothing changes in the data flow. The zoom plugin operates entirely within the yarl rendering layer:

```
App.jsx
  └─ LightboxWrapper (MODIFIED — adds Zoom plugin + zoom prop)
       └─ YarlLightbox (unchanged API contract)
            ├─ Download plugin (unchanged)
            └─ Zoom plugin (NEW — adds gesture/scroll handling internally)
```

The `slides` array shape, `open`/`index`/`onClose` props, and all upstream state in `App.jsx` are untouched.

---

## Test File Impact

The existing `Lightbox.test.jsx` mocks the plugins array and asserts `plugins.toContain('DownloadPluginMock')`. Adding Zoom requires:

1. A new vi.mock at the top of the test file:
   ```js
   vi.mock('yet-another-react-lightbox/plugins/zoom', () => ({ default: 'ZoomPluginMock' }));
   ```
2. A new test (or extension of D1) asserting `plugins` also contains `'ZoomPluginMock'`
3. A test asserting `zoom.scrollToZoom === true` is present in the props

The existing D1–D3 and L1–L2 tests require no changes to their assertions — they don't inspect the `zoom` prop or the Zoom plugin today.

---

## Build Order

Because this is a single-file change with a test suite update, the build order is linear:

1. **Mock setup in test file** — add `vi.mock` for the Zoom plugin (precondition for tests to not fail on import)
2. **Modify `Lightbox.jsx`** — add import, add to plugins array, add zoom prop
3. **Add test assertions** — verify Zoom plugin is in plugins array and zoom.scrollToZoom is true
4. **Manual smoke test** — verify pinch, scroll-wheel, and drag-to-pan all work in the deployed build

No new components, no new files, no changes to pipeline, metadata.json schema, or App.jsx state.

---

## Pitfalls Specific to This Integration

### `scrollToZoom` defaults to false
The most common missed step: scroll-wheel zoom on desktop does nothing unless `scrollToZoom: true` is explicitly set. ZOOM-02 (scroll-wheel zoom) will silently fail without it.

### Test mock must be added before the import
Vitest hoists `vi.mock` calls, but only those that appear before the relevant import. The pattern in `Lightbox.test.jsx` is already established — follow the same top-of-file mock pattern for the Zoom plugin.

### Plugin array test assertion
The existing D1 test checks `plugins.toContain('DownloadPluginMock')`. After adding Zoom, that test still passes. But a new assertion should confirm the Zoom mock is also present, to prevent future accidental removal.

### RTL portal — no interaction with Zoom
The `portal={{ container: { dir: 'rtl' } }}` config is orthogonal to zoom. The Zoom plugin's gesture handling is layout-direction-agnostic. No RTL-specific zoom configuration is needed.

### `maxZoomPixelRatio` default is 1 (not intuitive)
At default, zooming stops the moment the image hits its natural resolution. For wedding photos displayed at `≤2000px` with guests on retina screens, the perceived maximum zoom may feel very limited. Set to `2` to allow meaningful zoom into detail.

---

## Sources

- Context7 / official yarl docs: https://github.com/igordanchenko/yet-another-react-lightbox/blob/main/docs/plugins/zoom.md (HIGH confidence)
- Official plugin demo: https://yet-another-react-lightbox.com/plugins/zoom (HIGH confidence)
- Controller docs (disableSwipeNavigation): https://github.com/igordanchenko/yet-another-react-lightbox/blob/main/docs/documentation.md (HIGH confidence)
- Discussion #246 (arrow keys not configurable when zoomed): https://github.com/igordanchenko/yet-another-react-lightbox/discussions/246 (HIGH confidence — maintainer response)
- Issue #380 (pinch-out bug, fixed): https://github.com/igordanchenko/yet-another-react-lightbox/issues/380 (HIGH confidence — closed/released)
