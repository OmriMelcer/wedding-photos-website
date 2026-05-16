import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFilters } from '@/hooks/useFilters';
import { usePhotos } from '@/hooks/usePhotos';
import { PHASE_ORDER } from '@/config';

// Hand-crafted in-test fixture — 10 photos across all 5 phases and all 3 photographers.
// sort_key values are intentionally shuffled within some phases to verify sort behavior.
const FIXTURE = [
  // prep — 2 photos
  { id: 'p01', cluster: 'prep',          photographer: 'abir_sultan',    sort_key: 2, r2_url: 'r/p01', thumb_url: 't/p01' },
  { id: 'p02', cluster: 'prep',          photographer: 'inbal_zeldin',   sort_key: 1, r2_url: 'r/p02', thumb_url: 't/p02' },
  // photoshooting — 2 photos
  { id: 'p03', cluster: 'photoshooting', photographer: 'magnate_images', sort_key: 4, r2_url: 'r/p03', thumb_url: 't/p03' },
  { id: 'p04', cluster: 'photoshooting', photographer: 'abir_sultan',    sort_key: 3, r2_url: 'r/p04', thumb_url: 't/p04' },
  // dining — 2 photos
  { id: 'p05', cluster: 'dining',        photographer: 'inbal_zeldin',   sort_key: 5, r2_url: 'r/p05', thumb_url: 't/p05' },
  { id: 'p06', cluster: 'dining',        photographer: 'magnate_images', sort_key: 6, r2_url: 'r/p06', thumb_url: 't/p06' },
  // hupa — 2 photos
  { id: 'p07', cluster: 'hupa',          photographer: 'abir_sultan',    sort_key: 8, r2_url: 'r/p07', thumb_url: 't/p07' },
  { id: 'p08', cluster: 'hupa',          photographer: 'inbal_zeldin',   sort_key: 7, r2_url: 'r/p08', thumb_url: 't/p08' },
  // dancing — 2 photos
  { id: 'p09', cluster: 'dancing',       photographer: 'magnate_images', sort_key: 9,  r2_url: 'r/p09', thumb_url: 't/p09' },
  { id: 'p10', cluster: 'dancing',       photographer: 'abir_sultan',    sort_key: 10, r2_url: 'r/p10', thumb_url: 't/p10' },
];

describe('useFilters', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initial state: empty Sets → filteredByPhase has all photos per phase; flatFilteredPhotos follows PHASE_ORDER then sort_key', () => {
    const { result } = renderHook(() => useFilters(FIXTURE));

    // filteredByPhase contains all photos for each phase
    expect(result.current.filteredByPhase['prep']).toHaveLength(2);
    expect(result.current.filteredByPhase['photoshooting']).toHaveLength(2);
    expect(result.current.filteredByPhase['dining']).toHaveLength(2);
    expect(result.current.filteredByPhase['hupa']).toHaveLength(2);
    expect(result.current.filteredByPhase['dancing']).toHaveLength(2);

    // flatFilteredPhotos is all 10 photos
    expect(result.current.flatFilteredPhotos).toHaveLength(10);

    // Follows PHASE_ORDER — first two photos must be prep, last two dancing
    expect(result.current.flatFilteredPhotos[0].cluster).toBe('prep');
    expect(result.current.flatFilteredPhotos[1].cluster).toBe('prep');
    expect(result.current.flatFilteredPhotos[8].cluster).toBe('dancing');
    expect(result.current.flatFilteredPhotos[9].cluster).toBe('dancing');

    // Within prep: sort_key 1 before 2
    const prepPhotos = result.current.filteredByPhase['prep'];
    expect(prepPhotos[0].sort_key).toBe(1);
    expect(prepPhotos[1].sort_key).toBe(2);
  });

  it('FILT-01 single photographer filter: reduces to only that photographer photos', () => {
    const { result } = renderHook(() => useFilters(FIXTURE));

    act(() => {
      result.current.togglePhotographer('abir_sultan');
    });

    // abir_sultan has photos in prep, photoshooting, hupa, dancing (not dining)
    const flat = result.current.flatFilteredPhotos;
    expect(flat.every(p => p.photographer === 'abir_sultan')).toBe(true);
    // dining has no abir_sultan photos → empty
    expect(result.current.filteredByPhase['dining']).toHaveLength(0);
  });

  it('FILT-01 multi-photographer OR-within: two selected → photos from either photographer included', () => {
    const { result } = renderHook(() => useFilters(FIXTURE));

    act(() => {
      result.current.togglePhotographer('abir_sultan');
      result.current.togglePhotographer('inbal_zeldin');
    });

    const flat = result.current.flatFilteredPhotos;
    expect(flat.length).toBeGreaterThan(0);
    flat.forEach(p => {
      expect(['abir_sultan', 'inbal_zeldin']).toContain(p.photographer);
    });
    // magnate_images photos should NOT appear
    expect(flat.some(p => p.photographer === 'magnate_images')).toBe(false);
  });

  it('FILT-02 single phase filter: only that phase photos in flatFilteredPhotos', () => {
    const { result } = renderHook(() => useFilters(FIXTURE));

    act(() => {
      result.current.togglePhase('hupa');
    });

    const flat = result.current.flatFilteredPhotos;
    expect(flat.every(p => p.cluster === 'hupa')).toBe(true);
    expect(flat).toHaveLength(2);

    // Other phases should be empty
    expect(result.current.filteredByPhase['prep']).toHaveLength(0);
    expect(result.current.filteredByPhase['dancing']).toHaveLength(0);
  });

  it('FILT-02 multi-phase OR-within: two phases selected → photos from either phase included', () => {
    const { result } = renderHook(() => useFilters(FIXTURE));

    act(() => {
      result.current.togglePhase('prep');
      result.current.togglePhase('dancing');
    });

    const flat = result.current.flatFilteredPhotos;
    expect(flat.length).toBe(4); // 2 prep + 2 dancing
    flat.forEach(p => {
      expect(['prep', 'dancing']).toContain(p.cluster);
    });
    expect(flat.some(p => p.cluster === 'hupa')).toBe(false);
  });

  it('AND across groups (D-09): photographer A + phase prep → only photos where BOTH match', () => {
    const { result } = renderHook(() => useFilters(FIXTURE));

    act(() => {
      result.current.togglePhotographer('abir_sultan');
      result.current.togglePhase('prep');
    });

    const flat = result.current.flatFilteredPhotos;
    // Only photo matching abir_sultan AND prep: p01
    expect(flat).toHaveLength(1);
    expect(flat[0].id).toBe('p01');
  });

  it('FILT-03 clearAll: resets both Sets to size 0 and restores the unfiltered view', () => {
    const { result } = renderHook(() => useFilters(FIXTURE));

    act(() => {
      result.current.togglePhotographer('abir_sultan');
      result.current.togglePhase('hupa');
    });

    // After filtering, count is reduced
    expect(result.current.flatFilteredPhotos.length).toBeLessThan(10);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.selectedPhotographers.size).toBe(0);
    expect(result.current.selectedPhases.size).toBe(0);
    // All 10 photos restored
    expect(result.current.flatFilteredPhotos).toHaveLength(10);
  });

  it('toggle adds then removes: calling togglePhotographer twice removes the entry', () => {
    const { result } = renderHook(() => useFilters(FIXTURE));

    act(() => {
      result.current.togglePhotographer('magnate_images');
    });
    expect(result.current.selectedPhotographers.has('magnate_images')).toBe(true);

    act(() => {
      result.current.togglePhotographer('magnate_images');
    });
    expect(result.current.selectedPhotographers.has('magnate_images')).toBe(false);
    // Back to unfiltered
    expect(result.current.flatFilteredPhotos).toHaveLength(10);
  });

  it('flatFilteredPhotos ordering: follows PHASE_ORDER then sort_key ascending within each phase', () => {
    const { result } = renderHook(() => useFilters(FIXTURE));

    const flat = result.current.flatFilteredPhotos;
    expect(flat).toHaveLength(10);

    // Verify PHASE_ORDER sequencing: collect phase sequence from flat
    const phaseSequence = flat.map(p => p.cluster);
    // All prep come before photoshooting, photoshooting before dining, etc.
    let lastPhaseIndex = -1;
    phaseSequence.forEach(phase => {
      const idx = PHASE_ORDER.indexOf(phase);
      expect(idx).toBeGreaterThanOrEqual(lastPhaseIndex);
      lastPhaseIndex = idx;
    });

    // Verify sort_key ascending within each phase
    PHASE_ORDER.forEach(phase => {
      const phasePhotos = result.current.filteredByPhase[phase];
      for (let i = 1; i < phasePhotos.length; i++) {
        expect(phasePhotos[i].sort_key).toBeGreaterThan(phasePhotos[i - 1].sort_key);
      }
    });

    // Specific: prep is sorted by sort_key (p02=1 before p01=2)
    const prepPhotos = result.current.filteredByPhase['prep'];
    expect(prepPhotos[0].id).toBe('p02'); // sort_key 1
    expect(prepPhotos[1].id).toBe('p01'); // sort_key 2
  });

  it('no re-fetch dependency: toggling a filter does NOT cause usePhotos to fetch again (GALL-01 integration)', async () => {
    const mockPhotos = [
      { id: 'mp1', cluster: 'prep', photographer: 'abir_sultan', sort_key: 1, r2_url: 'r/mp1', thumb_url: 't/mp1' },
      { id: 'mp2', cluster: 'hupa', photographer: 'inbal_zeldin', sort_key: 2, r2_url: 'r/mp2', thumb_url: 't/mp2' },
    ];

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ photos: mockPhotos, people: [] }),
    });

    const { result } = renderHook(() => {
      const { photos } = usePhotos();
      return useFilters(photos);
    });

    // Wait for the fetch to resolve
    await waitFor(() => {
      expect(result.current.flatFilteredPhotos).toHaveLength(2);
    });

    // Confirm fetch happened exactly once
    expect(fetchSpy.mock.calls.length).toBe(1);

    // Toggle a photographer filter
    act(() => {
      result.current.togglePhotographer('abir_sultan');
    });

    // Assert no additional fetch was triggered
    expect(fetchSpy.mock.calls.length).toBe(1);
  });
});
