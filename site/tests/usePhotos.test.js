import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePhotos } from '@/hooks/usePhotos';
import { METADATA_URL } from '@/config';

// Minimal fixture for mocked fetch responses — 2 photos, 2 clusters, 2 photographers.
const FIXTURE_PHOTOS = [
  {
    id: 'p1',
    filename: 'p1.jpg',
    r2_url: 'https://example.com/p1.jpg',
    thumb_url: 'https://example.com/p1_thumb.jpg',
    photographer: 'abir_sultan',
    timestamp: '2025-06-14T08:30:00',
    cluster: 'prep',
    cluster_confidence: 0.97,
    faces: [],
    sort_key: 1,
  },
  {
    id: 'p2',
    filename: 'p2.jpg',
    r2_url: 'https://example.com/p2.jpg',
    thumb_url: 'https://example.com/p2_thumb.jpg',
    photographer: 'inbal_zeldin',
    timestamp: '2025-06-14T14:10:00',
    cluster: 'hupa',
    cluster_confidence: 0.91,
    faces: [],
    sort_key: 2,
  },
];

const FIXTURE_PEOPLE = [{ id: 'person_1', name: 'Alice' }];

function makeFetchOk(photos = FIXTURE_PHOTOS, people = []) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve({ photos, people }),
  };
}

describe('usePhotos', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls fetch exactly once on mount with METADATA_URL', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(makeFetchOk());

    const { result } = renderHook(() => usePhotos());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(METADATA_URL);
  });

  it('sets photos, people, loading=false, error=null after a successful fetch', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(makeFetchOk(FIXTURE_PHOTOS, FIXTURE_PEOPLE));

    const { result } = renderHook(() => usePhotos());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.photos).toEqual(FIXTURE_PHOTOS);
    expect(result.current.people).toEqual(FIXTURE_PEOPLE);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns people as [] when data.people is an empty array', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(makeFetchOk(FIXTURE_PHOTOS, []));

    const { result } = renderHook(() => usePhotos());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.people).toEqual([]);
    expect(Array.isArray(result.current.people)).toBe(true);
  });

  it('sets error.message to "HTTP 500: Internal Server Error" when fetch response is not ok', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const { result } = renderHook(() => usePhotos());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toBe('HTTP 500: Internal Server Error');
    expect(result.current.photos).toEqual([]);
  });

  it('sets error when photos field is not an array', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ photos: 'not-an-array', people: [] }),
    });

    const { result } = renderHook(() => usePhotos());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toContain('photos field is not an array');
  });

  it('does NOT call fetch a second time after rerender (GALL-01 no-re-fetch invariant)', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(makeFetchOk());

    const { result, rerender } = renderHook(() => usePhotos());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchSpy.mock.calls.length).toBe(1);

    act(() => {
      rerender();
    });

    expect(fetchSpy.mock.calls.length).toBe(1);
  });
});
