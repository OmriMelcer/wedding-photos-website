// Root component — owns fetch state (via usePhotos) and filter state (via useFilters).
// Conditionally renders LoadingSkeleton, ErrorState, or the full gallery layout.
import { useState } from 'react';
import { usePhotos } from '@/hooks/usePhotos';
import { useFilters } from '@/hooks/useFilters';
import Filters from '@/components/Filters';
import Gallery from '@/components/Gallery';
import LightboxWrapper from '@/components/Lightbox';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ErrorState from '@/components/ErrorState';

export default function App() {
  const { photos, people, loading, error } = usePhotos();
  const {
    filteredByPhase,
    flatFilteredPhotos,
    selectedPhotographers,
    selectedPhases,
    togglePhotographer,
    togglePhase,
    clearAll,
  } = useFilters(photos);

  const [lightboxIndex, setLightboxIndex] = useState(-1);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="min-h-screen bg-stone-50">
      <Filters
        people={people}
        selectedPhotographers={selectedPhotographers}
        selectedPhases={selectedPhases}
        onTogglePhotographer={togglePhotographer}
        onTogglePhase={togglePhase}
        onClearAll={clearAll}
      />
      <main className="px-4 sm:px-8 lg:px-12">
        <Gallery
          filteredByPhase={filteredByPhase}
          flatFilteredPhotos={flatFilteredPhotos}
          onPhotoClick={setLightboxIndex}
        />
      </main>
      <LightboxWrapper
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        slides={flatFilteredPhotos}
        onClose={() => setLightboxIndex(-1)}
      />
    </div>
  );
}
