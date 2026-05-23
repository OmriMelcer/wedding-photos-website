// Canonical map per CONTEXT.md D-14, D-15 and UI-SPEC §11. Photographer keys verified against pipeline/output/metadata.json.

export const PHASE_LABELS = {
  prep: 'מתכוננים',
  photoshooting: 'מצטלמים',
  dining: 'אוכלים',
  hupa: 'מתחתנים',
  dancing: 'רוקדים',
};

// Order = actual wedding timeline. DO NOT reorder.
export const PHASE_ORDER = ['prep', 'photoshooting', 'dining', 'hupa', 'dancing'];

// Keys must match photographer field in metadata.json exactly.
// Source: pipeline/config.yaml lines 38-47
export const PHOTOGRAPHER_NAMES = {
  abir_sultan: 'אביר סולטן',
  inbal_zeldin: 'ענבל זלדין',
  magnate_images: 'מגנטים',
};

// Album URLs — update here when links change. Per CONF-01 these must remain in config.js so component code does not change.
export const ALBUM_LINKS = [
  { label: 'אביר סולטן', url: 'https://photos.app.goo.gl/y5DtXuuTygEUo6DN7' },
  { label: 'ענבל זלדין', url: 'https://photos.app.goo.gl/DxwFxEfcAb3SHe519' },
  { label: 'מגנטים', url: 'https://justsmile.pic-time.com/client/noa--omri/gallery' },
  { label: 'פילם', url: 'https://photos.app.goo.gl/DxwFxEfcAb3SHe519' },
];

// Override with VITE_METADATA_URL for production (R2 URL)
export const METADATA_URL = import.meta.env.VITE_METADATA_URL || '/metadata.json';
