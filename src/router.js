/* =============================================================
 * router.js — v0.1.0
 * Einfacher Hash-Router: Routen definieren, Starten, Navigieren.
 * ============================================================= */
const routes = new Map();
let fallbackHandler = null;

function getPath() {
  const h = window.location.hash || '#/';
  return h.replace(/^#/, '');
}

function render() {
  const path = getPath();
  const handler = routes.get(path);
  if (handler) handler();
  else if (fallbackHandler) fallbackHandler();
}

export const Router = {
  define(path, handler) {
    routes.set(path, handler);
  },
  fallback(handler) {
    fallbackHandler = handler;
  },
  start() {
    window.addEventListener('hashchange', render);
    if (!window.location.hash) window.location.hash = '#/';
    render();
  },
  go(path) {
    window.location.hash = `#${path}`;
  }
};
