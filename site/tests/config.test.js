import { describe, it, expect } from 'vitest';
import {
  PHASE_LABELS,
  PHASE_ORDER,
  PHOTOGRAPHER_NAMES,
  METADATA_URL,
} from '@/config';

describe('config.js exports', () => {
  describe('PHASE_LABELS', () => {
    it('has exactly 5 keys', () => {
      expect(Object.keys(PHASE_LABELS)).toHaveLength(5);
    });

    it('maps phase keys to correct Hebrew display names', () => {
      expect(PHASE_LABELS.prep).toBe('הכנות');
      expect(PHASE_LABELS.photoshooting).toBe('צילומים');
      expect(PHASE_LABELS.dining).toBe('ארוחה');
      expect(PHASE_LABELS.hupa).toBe('חופה');
      expect(PHASE_LABELS.dancing).toBe('ריקודים');
    });
  });

  describe('PHASE_ORDER', () => {
    it('equals the actual wedding timeline order (not alphabetical)', () => {
      expect(PHASE_ORDER).toEqual([
        'prep',
        'photoshooting',
        'dining',
        'hupa',
        'dancing',
      ]);
    });
  });

  describe('PHOTOGRAPHER_NAMES', () => {
    it('has keys matching metadata.json photographer field values', () => {
      expect(Object.keys(PHOTOGRAPHER_NAMES)).toEqual(
        expect.arrayContaining(['abir_sultan', 'inbal_zeldin', 'magnate_images'])
      );
    });

    it('maps photographer keys to correct display names', () => {
      expect(PHOTOGRAPHER_NAMES.abir_sultan).toBe('עביר סולטן');
      expect(PHOTOGRAPHER_NAMES.inbal_zeldin).toBe('ענבל זלדין');
      expect(PHOTOGRAPHER_NAMES.magnate_images).toBe('Magnate Images');
    });
  });

  describe('METADATA_URL', () => {
    it('defaults to /metadata.json when VITE_METADATA_URL is not set', () => {
      expect(METADATA_URL).toBe('/metadata.json');
    });
  });
});
