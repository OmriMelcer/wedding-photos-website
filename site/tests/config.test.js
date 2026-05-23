import { describe, it, expect } from 'vitest';
import {
  PHASE_LABELS,
  PHASE_ORDER,
  PHOTOGRAPHER_NAMES,
  ALBUM_LINKS,
  METADATA_URL,
} from '@/config';

describe('config.js exports', () => {
  describe('PHASE_LABELS', () => {
    it('has exactly 5 keys', () => {
      expect(Object.keys(PHASE_LABELS)).toHaveLength(5);
    });

    it('maps phase keys to correct Hebrew display names', () => {
      expect(PHASE_LABELS.prep).toBe('מתכוננים');
      expect(PHASE_LABELS.photoshooting).toBe('מצטלמים');
      expect(PHASE_LABELS.dining).toBe('אוכלים');
      expect(PHASE_LABELS.hupa).toBe('מתחתנים');
      expect(PHASE_LABELS.dancing).toBe('רוקדים');
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
      expect(PHOTOGRAPHER_NAMES.abir_sultan).toBe('אביר סולטן');
      expect(PHOTOGRAPHER_NAMES.inbal_zeldin).toBe('ענבל זלדין');
      expect(PHOTOGRAPHER_NAMES.magnate_images).toBe('מגנטים');
    });
  });

  describe('METADATA_URL', () => {
    it('defaults to /metadata.json when VITE_METADATA_URL is not set', () => {
      expect(METADATA_URL).toBe('/metadata.json');
    });
  });

  describe('ALBUM_LINKS', () => {
    it('is exported as an array', () => {
      expect(Array.isArray(ALBUM_LINKS)).toBe(true);
    });

    it('has exactly 4 entries', () => {
      expect(ALBUM_LINKS).toHaveLength(4);
    });

    it('every entry has label (non-empty string) and url (string) keys', () => {
      ALBUM_LINKS.forEach(entry => {
        expect(typeof entry.label).toBe('string');
        expect(entry.label.length).toBeGreaterThan(0);
        expect(typeof entry.url).toBe('string');
      });
    });

    it('labels match exactly in the specified order', () => {
      expect(ALBUM_LINKS.map(e => e.label)).toEqual([
        'אביר סולטן',
        'ענבל זלדין',
        'מגנטים',
        'פילם',
      ]);
    });

    it('every entry url is a string', () => {
      ALBUM_LINKS.forEach(entry => {
        expect(typeof entry.url).toBe('string');
      });
    });
  });
});
