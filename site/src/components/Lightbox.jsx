// yarl (yet-another-react-lightbox) wrapper.
// slides = flatFilteredPhotos (the currently filtered set, NOT all photos — GALL-04, Pitfall 3).
// portal.container.dir = 'rtl' required because yarl portals out of the DOM tree
// and may not inherit dir="rtl" from <html> (RESEARCH.md §Pattern 3).
// Download plugin (DWNL-01): adds a download button to the lightbox toolbar.
// Uses the modern download: { url, filename } object form (NOT deprecated downloadUrl/downloadFilename).
// Zoom plugin (ZOOM-01/02/03): delivers pinch-to-zoom, scroll-wheel zoom, and drag-to-pan.
// maxZoomPixelRatio: 3 is MANDATORY — the default of 1 silently disables zoom on all retina/mobile devices.
// pinchZoomV4: true is MANDATORY — prevents iOS swipe-block after a fast pinch-out (fixed in yarl v3.27.0).
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
      plugins={[Zoom, Download]}
      labels={{ Download: 'הורדה' }}
      zoom={{ scrollToZoom: true, maxZoomPixelRatio: 3, pinchZoomV4: true, doubleClickMaxStops: 2 }}
      download={{ download: ({ slide }) => downloadFile(slide.download.url, slide.download.filename) }}
    />
  );
}
