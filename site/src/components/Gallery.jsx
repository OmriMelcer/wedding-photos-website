// Gallery — iterates PHASE_ORDER to render one GallerySection per non-empty phase (D-04, D-05).
// Empty sections return null — they are absent from the DOM entirely (not hidden via CSS).
// Shows EmptyState when all phases are empty after filtering.
import { PHASE_ORDER } from '@/config';
import GallerySection from '@/components/GallerySection';
import EmptyState from '@/components/EmptyState';

export default function Gallery({ filteredByPhase, flatFilteredPhotos, onPhotoClick }) {
  const hasAnyPhoto = PHASE_ORDER.some(
    phase => (filteredByPhase[phase] || []).length > 0
  );

  if (!hasAnyPhoto) return <EmptyState />;

  return (
    <div className="py-8 space-y-8">
      {PHASE_ORDER.map(phase => {
        const sectionPhotos = filteredByPhase[phase] || [];
        // Conditional render — empty sections absent from DOM (D-05, Pitfall 4)
        if (sectionPhotos.length === 0) return null;
        return (
          <GallerySection
            key={phase}
            phase={phase}
            photos={sectionPhotos}
            flatFilteredPhotos={flatFilteredPhotos}
            onPhotoClick={onPhotoClick}
          />
        );
      })}
    </div>
  );
}
