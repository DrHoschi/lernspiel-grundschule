/* =============================================================
 * lib/storage.js — v0.1.0
 * Kleiner Wrapper um LocalStorage (JSON sicher).
 * ============================================================= */
export const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  }
};
