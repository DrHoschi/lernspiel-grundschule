/* =============================================================
 * router.js — v0.1.1
 * Hash-Router mit Query-Support (#/path?x=1).
 * ============================================================= */
const routes = new Map();
let fallbackHandler = null;

function getRaw() {
  return (window.location.hash || '#/').replace(/^#/, '');
}
function getPath() {
  const raw = getRaw();
  const [path] = raw.split('?');   // <- Query entfernen
  return path || '/';
}
function getQuery() {
  const raw = getRaw();
  const [, q] = raw.split('?');
  return new URLSearchParams(q || '');
}

function render() {
  const path = getPath();
  const handler = routes.get(path);
  if (handler) handler({ query: getQuery(), path });
  else if (fallbackHandler) fallbackHandler({ query: getQuery(), path });
}

export const Router = {
  define(path, handler) { routes.set(path, handler); },
  fallback(handler) { fallbackHandler = handler; },
  start() {
    window.addEventListener('hashchange', render);
    if (!window.location.hash) window.location.hash = '#/';
    render();
  },
  go(path) { window.location.hash = `#${path}`; },
  getQuery,  // optionaler Export
  getPath
};
