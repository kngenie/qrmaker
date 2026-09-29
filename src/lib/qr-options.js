// Translates the app's user-facing settings into qr-code-styling options,
// plus the choices (with friendly labels) offered in the UI.

/** Ready-made combinations of dot / corner shapes. */
export const LOOKS = [
  { id: 'classic', label: 'Classic', dots: 'square', cornerSquare: 'square', cornerDot: 'square' },
  { id: 'rounded', label: 'Rounded', dots: 'rounded', cornerSquare: 'extra-rounded', cornerDot: 'dot' },
  { id: 'dots', label: 'Dots', dots: 'dots', cornerSquare: 'dot', cornerDot: 'dot' },
  { id: 'soft', label: 'Soft', dots: 'extra-rounded', cornerSquare: 'extra-rounded', cornerDot: 'square' },
  { id: 'elegant', label: 'Elegant', dots: 'classy-rounded', cornerSquare: 'extra-rounded', cornerDot: 'dot' },
  { id: 'leafy', label: 'Leafy', dots: 'classy', cornerSquare: 'square', cornerDot: 'square' },
];

export const DOT_SHAPES = [
  { value: 'square', label: 'Squares' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'extra-rounded', label: 'Extra rounded' },
  { value: 'dots', label: 'Dots' },
  { value: 'classy', label: 'Leafy' },
  { value: 'classy-rounded', label: 'Leafy, rounded' },
];

export const CORNER_SQUARE_SHAPES = [
  { value: 'square', label: 'Square' },
  { value: 'extra-rounded', label: 'Rounded' },
  { value: 'dot', label: 'Circle' },
];

export const CORNER_DOT_SHAPES = [
  { value: 'square', label: 'Square' },
  { value: 'dot', label: 'Circle' },
];

/**
 * Error correction, described by what it means to the user.
 * `bytes` is the maximum data length at the largest QR version (40) in byte mode.
 */
export const STURDINESS = [
  { value: 'L', label: 'Light', hint: 'Simplest pattern. Fine for screens.', bytes: 2953 },
  { value: 'M', label: 'Standard', hint: 'A good balance for most uses.', bytes: 2331 },
  { value: 'Q', label: 'Sturdy', hint: 'Still scans if a little scuffed or dirty.', bytes: 1663 },
  { value: 'H', label: 'Extra sturdy', hint: 'Best for print, or when adding a logo.', bytes: 1273 },
];

/** Empty space around the code, as a fraction of the image width. */
export const BORDERS = [
  { value: 'none', label: 'None', fraction: 0 },
  { value: 'narrow', label: 'Narrow', fraction: 0.04 },
  { value: 'standard', label: 'Standard', fraction: 0.08 },
  { value: 'wide', label: 'Wide', fraction: 0.12 },
];

export const SIZES = [
  { value: 400, label: 'Small', hint: '400 px · email, chat' },
  { value: 1000, label: 'Medium', hint: '1000 px · documents, slides' },
  { value: 2000, label: 'Large', hint: '2000 px · posters, print' },
];

export const FG_SWATCHES = [
  { color: '#1c1714', name: 'Charcoal' },
  { color: '#4a2c1c', name: 'Espresso' },
  { color: '#a63d1a', name: 'Terracotta' },
  { color: '#2f5d3a', name: 'Forest' },
  { color: '#1f3a5f', name: 'Navy' },
  { color: '#5b2a55', name: 'Plum' },
];

export const BG_SWATCHES = [
  { color: '#ffffff', name: 'White' },
  { color: '#fff6e5', name: 'Cream' },
  { color: '#ffe9d9', name: 'Peach' },
  { color: '#fdf1c7', name: 'Butter' },
];

export const DEFAULT_SETTINGS = Object.freeze({
  url: '',
  look: 'rounded',
  dots: 'rounded',
  cornerSquare: 'extra-rounded',
  cornerDot: 'dot',
  fg: '#1c1714',
  bg: '#ffffff',
  transparent: false,
  ecl: 'M',
  border: 'standard',
  size: 1000,
  logo: null, // data: URL of an image the user picked, or null
});

/** Fill in missing / invalid fields, e.g. for settings loaded from storage. */
export function sanitizeSettings(s) {
  const d = DEFAULT_SETTINGS;
  const pick = (v, list, key = 'value') => (list.some((o) => o[key] === v) ? v : undefined);
  const hex = (v) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : undefined);
  s = s && typeof s === 'object' ? s : {};
  return {
    url: typeof s.url === 'string' ? s.url : d.url,
    look: s.look === 'custom' ? 'custom' : pick(s.look, LOOKS, 'id') ?? d.look,
    dots: pick(s.dots, DOT_SHAPES) ?? d.dots,
    cornerSquare: pick(s.cornerSquare, CORNER_SQUARE_SHAPES) ?? d.cornerSquare,
    cornerDot: pick(s.cornerDot, CORNER_DOT_SHAPES) ?? d.cornerDot,
    fg: hex(s.fg) ?? d.fg,
    bg: hex(s.bg) ?? d.bg,
    transparent: s.transparent === true,
    ecl: pick(s.ecl, STURDINESS) ?? d.ecl,
    border: pick(s.border, BORDERS) ?? d.border,
    size: pick(s.size, SIZES) ?? d.size,
    logo: typeof s.logo === 'string' && s.logo.startsWith('data:image/') ? s.logo : null,
  };
}

/**
 * Turn what the user typed into the text that goes in the QR code.
 * Adds https:// when no scheme is given.
 * Returns { value, data } where `value` is for display and `data` is what gets encoded:
 * the URL's canonical ASCII form (punycode host, percent-encoded path), which every
 * scanner handles. Returns { error } if the input isn't usable.
 */
export function normalizeUrl(input) {
  const text = (input ?? '').trim();
  if (!text) return { value: '', data: '' };
  if (/\s/.test(text)) return { error: 'Web addresses can’t contain spaces.' };
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) && !/^[^:/]+:\d+(\/|$)/.test(text);
  const candidate = hasScheme ? text : `https://${text}`;
  let url;
  try {
    url = new URL(candidate);
  } catch {
    return { error: 'That doesn’t look like a web address. Try something like example.com' };
  }
  if ((url.protocol === 'http:' || url.protocol === 'https:') && !url.hostname.includes('.') && url.hostname !== 'localhost') {
    return { error: 'That address seems incomplete. Did you mean something like example.com?' };
  }
  return { value: candidate, data: url.href };
}

/** UTF-8 byte length, which is what counts toward QR capacity in byte mode. */
export function byteLength(text) {
  return new TextEncoder().encode(text).length;
}

/**
 * qr-code-styling keeps only the low byte of each character in byte mode,
 * so hand it UTF-8 bytes as a "binary string" (one char per byte).
 */
function toByteString(text) {
  return String.fromCharCode(...new TextEncoder().encode(text));
}

/**
 * Options for a QRCodeStyling instance rendering `data` at `size` pixels square.
 * `opaque` forces a solid background (JPEG can't be transparent).
 */
export function toQrOptions(settings, data, size, { opaque = false, type = 'svg' } = {}) {
  const border = BORDERS.find((b) => b.value === settings.border) ?? BORDERS[2];
  const transparent = settings.transparent && !opaque;
  return {
    type,
    width: size,
    height: size,
    margin: Math.round(size * border.fraction),
    data: toByteString(data),
    image: settings.logo ?? undefined,
    qrOptions: { typeNumber: 0, mode: 'Byte', errorCorrectionLevel: settings.ecl },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.35,
      margin: Math.round(size / 100),
    },
    dotsOptions: { type: settings.dots, color: settings.fg },
    cornersSquareOptions: { type: settings.cornerSquare, color: settings.fg },
    cornersDotOptions: { type: settings.cornerDot, color: settings.fg },
    backgroundOptions: { color: transparent ? 'rgba(0,0,0,0)' : settings.bg },
  };
}

// --- Color contrast, to warn about codes phones may struggle to read. ---

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Returns a warning message about the color choice, or null if it looks fine. */
export function colorWarning(settings) {
  const bg = settings.transparent ? '#ffffff' : settings.bg;
  const lf = luminance(settings.fg);
  const lb = luminance(bg);
  if (lf > lb) {
    return settings.transparent
      ? 'This code color is very light. Codes with a see-through background need a dark color and a light place to sit.'
      : 'Light codes on a dark background don’t work with some phone cameras. Try a darker code color.';
  }
  const ratio = (lb + 0.05) / (lf + 0.05);
  if (ratio < 4) {
    return 'The code and background colors are quite close. Phones may have trouble reading it — try more contrast.';
  }
  return null;
}
