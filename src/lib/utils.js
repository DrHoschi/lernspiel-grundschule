/* =============================================================
 * lib/utils.js — v0.1.0
 * Kleine Helferfunktionen (z. B. DOM).
 * ============================================================= */
export const Utils = {
  el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
};
