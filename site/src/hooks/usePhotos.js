// site/src/hooks/usePhotos.js
// Fetches metadata.json exactly once on mount (GALL-01).
// Never call fetch on filter change — empty dependency array enforces single-shot behavior.
import { useState, useEffect } from 'react';
import { METADATA_URL } from '@/config';

export function usePhotos() {
  const [state, setState] = useState({
    photos: [],
    people: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetch(METADATA_URL)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      })
      .then(data => {
        if (!Array.isArray(data.photos)) {
          throw new Error('metadata.json: photos field is not an array');
        }
        setState({
          photos: data.photos,
          people: Array.isArray(data.people) ? data.people : [],
          loading: false,
          error: null,
        });
      })
      .catch(err =>
        setState(s => ({ ...s, loading: false, error: err }))
      );
  }, []); // empty deps — fetch once on mount only (GALL-01)

  return state;
}
