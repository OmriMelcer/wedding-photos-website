// Canonical map per CONTEXT.md D-14, D-15 and UI-SPEC §11. Photographer keys verified against pipeline/output/metadata.json.

export const PHASE_LABELS = {
  prep: 'הכנות',
  photoshooting: 'צילומים',
  dining: 'ארוחה',
  hupa: 'חופה',
  dancing: 'ריקודים',
};

// Order = actual wedding timeline. DO NOT reorder.
export const PHASE_ORDER = ['prep', 'photoshooting', 'dining', 'hupa', 'dancing'];

// Keys must match photographer field in metadata.json exactly.
// Source: pipeline/config.yaml lines 38-47
export const PHOTOGRAPHER_NAMES = {
  abir_sultan: 'עביר סולטן',
  inbal_zeldin: 'ענבל זלדין',
  magnate_images: 'Magnate Images',
};

// Override with VITE_METADATA_URL for production (R2 URL)
export const METADATA_URL = import.meta.env.VITE_METADATA_URL || '/metadata.json';
