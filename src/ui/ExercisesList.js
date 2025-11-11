/* =============================================================
 * ui/ExercisesList.js — v0.2.0 (2025-11-11)
 * Auswahl + Start echter Übungen.
 *
 * Änderungen ggü. v0.1.1
 * - Titel mit Operator-Emojis (add/sub/mul/div, auch gemischt)
 * - Stabile Badges (Fallbacks für subject/grade)
 * - Einmaliger Global-Listener für cb:exercise:finished → #/rewards
 *   (nur Fallback; falls dein Router selbst navigiert, stört das nicht)
 * ============================================================= */
import { Exercises } from '../data/exercises.js';

const OP_EMOJI = { add:'➕', sub:'➖', mul:'✖️', div:'➗' };

function titleWithEmojis(def){
  const ops = Array.isArray(def.config?.ops) && def.config.ops.length
    ? def.config.ops
    : [def.config?.op || 'mul'];
  const prefix = [...new Set(ops)].map(o => OP_EMOJI[o] || '').join(' ');
  return `${prefix ? prefix + ' ' : ''}${def.title}`;
}

function badgeText(def){
  const subject = def.subject || 'Mathe';
  const grade   = (def.grade != null && def.grade !== '') ? def.grade : '—';
  return `${subject} · Klasse ${grade}`;
}

export const ExercisesList = {
  render(user) {
    const list = Exercises.list();
    const items = list.map(x => `
      <li class="panel">
        <div class="spread">
          <div>
            <strong>${titleWithEmojis(x)}</strong>
            <div class="badge">${badgeText(x)}</div>
          </div>
          <div>
            <button class="btn-start" data-id="${x.id}">Start</button>
          </div>
        </div>
      </li>`).join('');

    return `
      <section class="panel">
        <h2>Übungen</h2>
        <ul style="list-style:none;padding:0;margin:0;display:grid;gap:12px;">
          ${items}
        </ul>
      </section>`;
  },

  bind(rootEl) {
    // Start-Buttons: Route bleibt wie in deinem Original (#/exercise?id=…)
    rootEl.querySelectorAll('.btn-start').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        window.location.hash = `#/exercise?id=${encodeURIComponent(id)}`;
      });
    });

    // Einmaliger Fallback für das Abschluss-Event (Navigation zu Rewards),
    // falls dein Router/Play-Screen nicht selbst navigiert:
    if (!window.__ls_finishNavRegistered) {
      window.__ls_finishNavRegistered = true;
      window.addEventListener('cb:exercise:finished', () => {
        // Nur navigieren, wenn wir gerade NICHT schon auf einer gültigen Route mit Inhalt sind.
        // (Einfache, sichere Variante: immer zur Rewards-Seite springen.)
        location.hash = '#/rewards';
      });
    }
  }
};
