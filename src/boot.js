/* =============================================================
 * boot.js — v0.1.0
 * Aufgabe: Früher Einstieg, grundlegende Initialisierung, Logging,
 *          Laden der App (App.init) sobald DOM verfügbar ist.
 * Struktur:
 *   - Konstanten / Versionsinfo
 *   - DOM Ready
 *   - Safe-boot mit Fehlerfang
 * ============================================================= */
import { App } from './app.js';

const VERSION = 'v0.1.0';

function onDomReady(cb) {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    cb();
  } else {
    document.addEventListener('DOMContentLoaded', cb, { once: true });
  }
}

onDomReady(() => {
  try {
    console.log('[boot] Start', VERSION);
    App.init({ version: VERSION });
  } catch (err) {
    console.error('[boot] Fehler bei App.init', err);
    const main = document.getElementById('app-main');
    if (main) {
      main.innerHTML = `<div class="panel"><h2>Startfehler</h2><p>${String(err)}</p></div>`;
    }
  }
});
