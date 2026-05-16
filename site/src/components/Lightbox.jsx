// yarl (yet-another-react-lightbox) wrapper.
// slides = flatFilteredPhotos (the currently filtered set, NOT all photos — GALL-04, Pitfall 3).
// portal.container.dir = 'rtl' required because yarl portals out of the DOM tree
// and may not inherit dir="rtl" from <html> (RESEARCH.md §Pattern 3).
import YarlLightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

export default function LightboxWrapper({ open, index, slides, onClose }) {
  const yarlSlides = slides.map(photo => ({ src: photo.r2_url, alt: photo.id }));

  return (
    <YarlLightbox
      open={open}
      close={onClose}
      slides={yarlSlides}
      index={index}
      portal={{ container: { dir: 'rtl' } }}
    />
  );
}
