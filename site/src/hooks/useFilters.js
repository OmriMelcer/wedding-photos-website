// site/src/hooks/useFilters.js
// In-memory filter state + memoized derivation of per-phase and flat-filtered photo arrays.
// Filter semantics: AND across groups (photographer AND phase), OR within each group.
// Empty selection Set = "no filter applied" (all photos match for that group).
import { useState, useMemo, useCallback } from 'react';
import { PHASE_ORDER } from '@/config';

export function useFilters(photos) {
  const [selectedPhotographers, setSelectedPhotographers] = useState(new Set());
  const [selectedPhases, setSelectedPhases] = useState(new Set());

  // Per-phase filtered and sorted photo arrays.
  // deps: [photos, selectedPhotographers, selectedPhases]
  const filteredByPhase = useMemo(() => {
    return PHASE_ORDER.reduce((acc, phase) => {
      acc[phase] = photos
        .filter(p => p.cluster === phase)
        .filter(p =>
          selectedPhotographers.size === 0 ||
          selectedPhotographers.has(p.photographer)
        )
        .filter(p =>
          selectedPhases.size === 0 || selectedPhases.has(p.cluster)
        )
        .sort((a, b) => a.sort_key - b.sort_key);
      return acc;
    }, {});
  }, [photos, selectedPhotographers, selectedPhases]);

  // Flat ordered array following PHASE_ORDER then sort_key ascending within each phase.
  // Used as yarl slides (GALL-04) — must reflect the filtered set, not all photos.
  const flatFilteredPhotos = useMemo(
    () => PHASE_ORDER.flatMap(phase => filteredByPhase[phase] || []),
    [filteredByPhase]
  );

  // Toggle handlers create new Sets — never mutate existing state.
  const togglePhotographer = useCallback(label => {
    setSelectedPhotographers(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }, []);

  const togglePhase = useCallback(phase => {
    setSelectedPhases(prev => {
      const next = new Set(prev);
      next.has(phase) ? next.delete(phase) : next.add(phase);
      return next;
    });
  }, []);

  // Resets both filter groups to empty Sets (FILT-03 clearAll).
  const clearAll = useCallback(() => {
    setSelectedPhotographers(new Set());
    setSelectedPhases(new Set());
  }, []);

  return {
    filteredByPhase,
    flatFilteredPhotos,
    selectedPhotographers,
    selectedPhases,
    togglePhotographer,
    togglePhase,
    clearAll,
  };
}
