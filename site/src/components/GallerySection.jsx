// Single phase section — sticky Hebrew header + react-masonry-css grid of PhotoCards.
// Section header sticks below the filter bar (top-16 = 64px). CSS classes masonry-grid
// and masonry-grid_column are declared in index.css (react-masonry-css does not ship CSS).
import Masonry from 'react-masonry-css';
import { PHASE_LABELS } from '@/config';
import PhotoCard from '@/components/PhotoCard';

// Column counts per UI-SPEC §5.3 and CONTEXT.md D-03.
const BREAKPOINT_COLS = {
  default: 5,
  1280: 5,
  1024: 4,
  640: 3,
  0: 2,
};

export default function GallerySection({
  phase,
  photos,
  flatFilteredPhotos,
  onPhotoClick,
}) {
  return (
    <section>
      {/* Sticky section header — sits below the sticky filter bar */}
      <div className="sticky top-16 z-[5] bg-stone-50/90 backdrop-blur-sm py-3 mb-4">
        <h2 className="text-[22px] font-semibold leading-tight text-stone-800">
          {PHASE_LABELS[phase]}
          <span className="ms-2 text-sm font-normal text-stone-500">
            ({photos.length} תמונות)
          </span>
        </h2>
      </div>

      <Masonry
        breakpointCols={BREAKPOINT_COLS}
        className="masonry-grid"
        columnClassName="masonry-grid_column"
      >
        {photos.map(photo => {
          const flatIndex = flatFilteredPhotos.indexOf(photo);
          return (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onClick={() => onPhotoClick(flatIndex)}
            />
          );
        })}
      </Masonry>
    </section>
  );
}
