// Saved settings live only in this browser's localStorage.

import { sanitizeSettings } from './qr-options.js';

const KEY = 'qrmaker.saved.v1';

/** Logos bigger than this aren't saved, to stay well within the ~5 MB storage quota. */
export const MAX_SAVED_LOGO_CHARS = 200_000;

export function loadSaved() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(list)) return [];
    return list
      .filter((e) => e && typeof e.id === 'string' && typeof e.name === 'string')
      .map((e) => ({ id: e.id, name: e.name, savedAt: Number(e.savedAt) || 0, settings: sanitizeSettings(e.settings) }));
  } catch {
    return [];
  }
}

/** Returns true on success, false if storage is unavailable or full. */
export function storeSaved(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
