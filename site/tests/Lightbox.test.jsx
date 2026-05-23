// Lightbox tests — covers GALL-03 (opens on photo click) + GALL-04 (slides = filtered subset).
// vi.mock calls MUST be at module top level — Vitest hoists them before imports.
// The yarlMock must be declared INSIDE the factory using vi.fn() to avoid temporal dead zone issues.
import { vi } from 'vitest';

// Mock CSS import first (must precede yet-another-react-lightbox mock)
vi.mock('yet-another-react-lightbox/styles.css', () => ({}));

// Mock the yarl default export. The factory must not reference outer variables.
// We retrieve the mock reference via vi.mocked() after import.
vi.mock('yet-another-react-lightbox', () => {
  const mockFn = vi.fn(() => null);
  return { default: mockFn };
});

// Mock the Download plugin (DWNL-01)
vi.mock('yet-another-react-lightbox/plugins/download', () => ({ default: 'DownloadPluginMock' }));

// Mock the Zoom plugin (ZOOM-01/02/03)
vi.mock('yet-another-react-lightbox/plugins/zoom', () => ({ default: 'ZoomPluginMock' }));

// Imports after mocks
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useState } from 'react';
import * as YarlModule from 'yet-another-react-lightbox';
import { useFilters } from '@/hooks/useFilters';
import LightboxWrapper from '@/components/Lightbox';
import { PHASE_ORDER } from '@/config';

// Get the mock function reference from the mocked module
const yarlMock = vi.mocked(YarlModule.default);

// ─── Test fixtures ─────────────────────────────────────────────────────────────

function makePhoto(id, cluster, photographer, sort_key) {
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

// 5 photos across 3 phases and 2 photographers for L2 filtering test.
// abir_sultan: a1 (prep), a2 (prep), a3 (dancing) — 3 photos
// inbal_zeldin: b1 (dining), b2 (dining) — 2 photos
const FIVE_PHOTOS = [
  makePhoto('a1', 'prep',    'abir_sultan',  1),
  makePhoto('a2', 'prep',    'abir_sultan',  2),
  makePhoto('b1', 'dining',  'inbal_zeldin', 3),
  makePhoto('b2', 'dining',  'inbal_zeldin', 4),
  makePhoto('a3', 'dancing', 'abir_sultan',  5),
];

// ─── Test harness ─────────────────────────────────────────────────────────────

// Minimal harness: uses useFilters + renders clickable photo buttons + LightboxWrapper.
// Allows imperatively activating a photographer filter via a "activate filter" button.
function TestHarness({ photos, selectedPhotographer = null }) {
  const { filteredByPhase, flatFilteredPhotos, togglePhotographer } = useFilters(photos);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const handleActivateFilter = () => {
    if (selectedPhotographer) togglePhotographer(selectedPhotographer);
  };

  // Build flat order following PHASE_ORDER (same as flatFilteredPhotos)
  const flatPhotos = PHASE_ORDER.flatMap(phase => filteredByPhase[phase] || []);

  return (
    <div>
      {selectedPhotographer && (
        <button data-testid="activate-filter" onClick={handleActivateFilter}>
          activate filter
        </button>
      )}
      {flatPhotos.map((photo, idx) => (
        <button
          key={photo.id}
          data-testid={`photo-${photo.id}`}
          onClick={() => setLightboxIndex(idx)}
        >
          {photo.id}
        </button>
      ))}
      <LightboxWrapper
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        slides={flatFilteredPhotos}
        onClose={() => setLightboxIndex(-1)}
      />
    </div>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Lightbox (GALL-03 + GALL-04)', () => {
  beforeEach(() => {
    yarlMock.mockClear();
  });

  it('L1 (GALL-03 open on click + GALL-04 slides = filtered): clicking a photo opens lightbox with slides matching flatFilteredPhotos', () => {
    // 5 photos, no filter active → flatFilteredPhotos = all 5 in PHASE_ORDER/sort_key order
    render(<TestHarness photos={FIVE_PHOTOS} />);

    // Click first photo (a1 = index 0 in flat array)
    fireEvent.click(screen.getByTestId('photo-a1'));

    const lastCall = yarlMock.mock.calls[yarlMock.mock.calls.length - 1];
    expect(lastCall[0].open).toBe(true);
    expect(lastCall[0].index).toBe(0);

    // slides must match flatFilteredPhotos mapped to { src: r2_url, alt: id, download: { url, filename } }
    // PHASE_ORDER = ['prep','photoshooting','dining','hupa','dancing']
    // Photos: prep→[a1,a2], photoshooting→[], dining→[b1,b2], hupa→[], dancing→[a3]
    const expectedSlides = [
      { src: 'https://r2.example.com/photos/a1.jpg', alt: 'a1', download: { url: 'https://r2.example.com/photos/a1.jpg', filename: 'a1.jpg' } },
      { src: 'https://r2.example.com/photos/a2.jpg', alt: 'a2', download: { url: 'https://r2.example.com/photos/a2.jpg', filename: 'a2.jpg' } },
      { src: 'https://r2.example.com/photos/b1.jpg', alt: 'b1', download: { url: 'https://r2.example.com/photos/b1.jpg', filename: 'b1.jpg' } },
      { src: 'https://r2.example.com/photos/b2.jpg', alt: 'b2', download: { url: 'https://r2.example.com/photos/b2.jpg', filename: 'b2.jpg' } },
      { src: 'https://r2.example.com/photos/a3.jpg', alt: 'a3', download: { url: 'https://r2.example.com/photos/a3.jpg', filename: 'a3.jpg' } },
    ];
    expect(lastCall[0].slides).toEqual(expectedSlides);
  });

  it('L2 (GALL-04 filtered subset): filter excludes 2 photos → slides.length === 3, index === 1, only filtered r2_urls in slides', async () => {
    // Filter by abir_sultan → 3 photos remain (a1, a2, a3); inbal_zeldin excluded (b1, b2)
    render(<TestHarness photos={FIVE_PHOTOS} selectedPhotographer="abir_sultan" />);

    // Activate the abir_sultan filter
    await act(async () => {
      fireEvent.click(screen.getByTestId('activate-filter'));
    });

    // After filter: flatFilteredPhotos = [a1, a2, a3] (only abir_sultan photos in PHASE_ORDER)
    // Click a2 (2nd photo = index 1 in the filtered flat array)
    fireEvent.click(screen.getByTestId('photo-a2'));

    const lastCall = yarlMock.mock.calls[yarlMock.mock.calls.length - 1];

    // Exactly 3 slides (not 5)
    expect(lastCall[0].slides.length).toBe(3);
    // a2 is at index 1 in [a1, a2, a3]
    expect(lastCall[0].index).toBe(1);

    // Only abir_sultan r2_urls — inbal_zeldin must not appear
    const slidesSrcs = lastCall[0].slides.map(s => s.src);
    expect(slidesSrcs).toContain('https://r2.example.com/photos/a1.jpg');
    expect(slidesSrcs).toContain('https://r2.example.com/photos/a2.jpg');
    expect(slidesSrcs).toContain('https://r2.example.com/photos/a3.jpg');
    expect(slidesSrcs).not.toContain('https://r2.example.com/photos/b1.jpg');
    expect(slidesSrcs).not.toContain('https://r2.example.com/photos/b2.jpg');
  });
});

describe('Lightbox (DWNL-01)', () => {
  beforeEach(() => {
    yarlMock.mockClear();
  });

  it('D1 (DWNL-01 plugin registration): opening lightbox passes plugins array containing DownloadPluginMock', () => {
    render(<TestHarness photos={FIVE_PHOTOS} />);
    fireEvent.click(screen.getByTestId('photo-a1'));

    const lastCall = yarlMock.mock.calls[yarlMock.mock.calls.length - 1];
    expect(Array.isArray(lastCall[0].plugins)).toBe(true);
    expect(lastCall[0].plugins).toContain('DownloadPluginMock');
  });

  it('D2 (DWNL-01 download metadata): every slide has download.url === r2_url and download.filename === filename', () => {
    render(<TestHarness photos={FIVE_PHOTOS} />);
    fireEvent.click(screen.getByTestId('photo-a1'));

    const lastCall = yarlMock.mock.calls[yarlMock.mock.calls.length - 1];
    const slides = lastCall[0].slides;

    // Each slide download.url must match the photo's r2_url (same as src)
    slides.forEach(slide => {
      expect(slide.download).toBeDefined();
      expect(slide.download.url).toBe(slide.src);
      expect(typeof slide.download.filename).toBe('string');
      expect(slide.download.filename.length).toBeGreaterThan(0);
    });

    // Spot-check specific photos
    const a1Slide = slides.find(s => s.alt === 'a1');
    expect(a1Slide.download.url).toBe('https://r2.example.com/photos/a1.jpg');
    expect(a1Slide.download.filename).toBe('a1.jpg');
  });

  it('D3 (DWNL-01 Hebrew label): labels.Download is set to Hebrew הורדה', () => {
    render(<TestHarness photos={FIVE_PHOTOS} />);
    fireEvent.click(screen.getByTestId('photo-a1'));

    const lastCall = yarlMock.mock.calls[yarlMock.mock.calls.length - 1];
    expect(lastCall[0].labels).toBeDefined();
    expect(lastCall[0].labels.Download).toBe('הורדה');
  });
});

describe('Lightbox (ZOOM-01/02/03)', () => {
  beforeEach(() => {
    yarlMock.mockClear();
  });

  it('Z1/Z2/Z3 (ZOOM-01/02/03 plugin registration and config): Zoom plugin is registered before Download with correct zoom config', () => {
    render(<TestHarness photos={FIVE_PHOTOS} />);
    fireEvent.click(screen.getByTestId('photo-a1'));

    const lastCall = yarlMock.mock.calls[yarlMock.mock.calls.length - 1];

    // Z1: plugins array contains ZoomPluginMock
    expect(Array.isArray(lastCall[0].plugins)).toBe(true);
    expect(lastCall[0].plugins).toContain('ZoomPluginMock');

    // Z2: ZoomPluginMock appears before DownloadPluginMock (RTL toolbar order)
    const zoomIndex = lastCall[0].plugins.indexOf('ZoomPluginMock');
    const downloadIndex = lastCall[0].plugins.indexOf('DownloadPluginMock');
    expect(zoomIndex).toBeLessThan(downloadIndex);

    // Z3: zoom prop equals the full required config object
    expect(lastCall[0].zoom).toEqual({
      scrollToZoom: true,
      maxZoomPixelRatio: 3,
      pinchZoomV4: true,
      doubleClickMaxStops: 2,
    });
  });
});
