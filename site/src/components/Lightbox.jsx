// yarl (yet-another-react-lightbox) wrapper.
// slides = flatFilteredPhotos (the currently filtered set, NOT all photos — GALL-04, Pitfall 3).
// portal.container.dir = 'rtl' required because yarl portals out of the DOM tree
// and may not inherit dir="rtl" from <html> (RESEARCH.md §Pattern 3).
// Download plugin (DWNL-01): adds a download button to the lightbox toolbar.
// Uses the modern download: { url, filename } object form (NOT deprecated downloadUrl/downloadFilename).
import YarlLightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Download from 'yet-another-react-lightbox/plugins/download';

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
      plugins={[Download]}
      labels={{ Download: 'הורדה' }}
    />
  );
}
