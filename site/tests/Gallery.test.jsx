// Gallery component tests — covers GALL-02 (PHASE_ORDER rendering, empty section absence).
// react-masonry-css is mocked because it relies on CSS that is not available in jsdom.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Gallery from '@/components/Gallery';
import { PHASE_LABELS, PHASE_ORDER } from '@/config';

// Mock react-masonry-css to avoid CSS-in-jsdom issues (Pitfall 6 mitigation for tests).
vi.mock('react-masonry-css', () => ({
  default: ({ children }) => <div data-testid="masonry">{children}</div>,
}));

// Hand-crafted photo fixture — all required fields from metadata.json schema.
function makePhoto(id, cluster, photographer = 'abir_sultan', sort_key = 1) {
  return {
    id,
    cluster,
    photographer,
    sort_key,
    r2_url: `https://r2.example.com/photos/${id}.jpg`,
    thumb_url: `https://r2.example.com/thumbs/${id}.jpg`,
    filename: `${id}.jpg`,
    timestamp: '2025-06-14T17:32:00',
    cluster_confidence: 0.9,
    faces: [],
  };
}

// Build a full filteredByPhase fixture with N photos per phase.
function buildFilteredByPhase(countPerPhase) {
  const result = {};
  PHASE_ORDER.forEach((phase, phaseIdx) => {
    const count = countPerPhase[phase] ?? 0;
    result[phase] = Array.from({ length: count }, (_, i) =>
      makePhoto(`${phase}_${i}`, phase, 'abir_sultan', phaseIdx * 10 + i)
    );
  });
  return result;
}

function flattenFilteredByPhase(filteredByPhase) {
  return PHASE_ORDER.flatMap(phase => filteredByPhase[phase] || []);
}

const noop = () => {};

describe('Gallery', () => {
  it('G1 (GALL-02 PHASE_ORDER): all 5 phases non-empty → h2 headings render in PHASE_ORDER order with correct Hebrew labels', () => {
    const filteredByPhase = buildFilteredByPhase({
      prep: 2,
      photoshooting: 2,
      dining: 2,
      hupa: 2,
      dancing: 2,
    });
    const flatFilteredPhotos = flattenFilteredByPhase(filteredByPhase);

    render(
      <Gallery
        filteredByPhase={filteredByPhase}
        flatFilteredPhotos={flatFilteredPhotos}
        onPhotoClick={noop}
      />
    );

    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(5);

    // Headings must appear in PHASE_ORDER order with Hebrew labels
    PHASE_ORDER.forEach((phase, i) => {
      expect(headings[i].textContent).toContain(PHASE_LABELS[phase]);
    });
  });

  it('G2 (D-05 empty section absence): 2 empty phases → only 3 h2 headings in DOM; empty-phase labels absent', () => {
    // prep and dancing have 0 photos (empty); photoshooting, dining, hupa have photos
    const filteredByPhase = buildFilteredByPhase({
      prep: 0,
      photoshooting: 3,
      dining: 3,
      hupa: 3,
      dancing: 0,
    });
    const flatFilteredPhotos = flattenFilteredByPhase(filteredByPhase);

    render(
      <Gallery
        filteredByPhase={filteredByPhase}
        flatFilteredPhotos={flatFilteredPhotos}
        onPhotoClick={noop}
      />
    );

    // Exactly 3 h2 headings — empty phases are absent from DOM, not just hidden
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(3);

    // Empty phase Hebrew labels must NOT be in the document (not display:none)
    expect(screen.queryByText(PHASE_LABELS['prep'])).toBeNull();
    expect(screen.queryByText(PHASE_LABELS['dancing'])).toBeNull();

    // Non-empty phase labels ARE present
    expect(screen.getByText(text => text.includes(PHASE_LABELS['photoshooting']))).toBeInTheDocument();
    expect(screen.getByText(text => text.includes(PHASE_LABELS['dining']))).toBeInTheDocument();
    expect(screen.getByText(text => text.includes(PHASE_LABELS['hupa']))).toBeInTheDocument();
  });

  it('G3 (all-empty → EmptyState): all phases empty → EmptyState message rendered', () => {
    const filteredByPhase = buildFilteredByPhase({
      prep: 0,
      photoshooting: 0,
      dining: 0,
      hupa: 0,
      dancing: 0,
    });
    const flatFilteredPhotos = [];

    render(
      <Gallery
        filteredByPhase={filteredByPhase}
        flatFilteredPhotos={flatFilteredPhotos}
        onPhotoClick={noop}
      />
    );

    // EmptyState Hebrew message
    expect(
      screen.getByText('אין תמונות התואמות לסינון הנוכחי')
    ).toBeInTheDocument();

    // No h2 headings (no sections rendered)
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
  });
});
