/* =============================================================
 * ui/ExercisesList.js — v0.3.1 (2025-11-11)
 * - Blaue Operator-Emojis (sichtbar im Dark-Theme)
 * - Zahlenraum-Vorauswahl: 10 / 100 / 1 000 / 1 000 000
 * - FIX: Fallback-Navigation nach Abschluss → #/exercises (statt #/rewards)
 * ============================================================= */
import { Exercises } from '../data/exercises.js';

const OP_EMOJI = { add:'➕', sub:'➖', mul:'✖️', div:'➗' };
const RANGE_PRESETS = [10, 100, 1000, 1000000];

function emojiStrip(def){
  const ops = Array.isArray(def.config?.ops) && def.config.ops.length
    ? def.config.ops
    : [def.config?.op || 'mul'];
  const unique = [...new Set(ops)];
  return unique.map(o => `<span class="op-emoji" title="${o}">${OP_EMOJI[o]||''}</span>`).join(' ');
}
function badgeText(def){
  const subject = def.subject || 'Mathe';
  const grade   = (def.grade != null && def.grade !== '') ? def.grade : '—';
  return `${subject} · Klasse ${grade}`;
}

export const ExercisesList = {
  render() {
    const list = Exercises.list();
    const items = list.map(x => {
      const ranges = RANGE_PRESETS.map((val, i) => `
        <button class="rng${i===0?' is-active':''}" data-val="${val}">
          ${val.toLocaleString('de-DE')}
        </button>`).join('');
      return `
      <li class="panel ex-item" data-id="${x.id}" data-range="${RANGE_PRESETS[0]}">
        <div class="spread">
          <div>
            <strong class="ex-title">${emojiStrip(x)} <span>${x.title}</span></strong>
            <div class="badge">${badgeText(x)}</div>
          </div>
          <div class="ex-actions">
            <div class="range-select">${ranges}</div>
            <button class="btn-start">Start</button>
          </div>
        </div>
      </li>`;
    }).join('');

    const style = `
      <style>
        .op-emoji{ font-weight:700; color:#4da3ff; margin-right:.25em }
        .ex-actions{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; justify-content:flex-end }
        .range-select{ display:flex; gap:6px; flex-wrap:wrap }
        .range-select button{ padding:4px 8px; border-radius:8px; border:1px solid var(--border,#2a2f3a); background:transparent; color:inherit; }
        .range-select button.is-active{ background:#1d3b66; border-color:#2e5ea6; color:#cfe3ff }
        @media (max-width:480px){ .ex-actions{ flex-direction:column; align-items:stretch } }
      </style>`;

    return `
      ${style}
      <section class="panel">
        <h2>Übungen</h2>
        <ul style="list-style:none;padding:0;margin:0;display:grid;gap:12px;">
          ${items}
        </ul>
      </section>`;
  },

  bind(rootEl) {
    // Zahlenraum je Eintrag wählen
    rootEl.querySelectorAll('.ex-item').forEach(li => {
      li.querySelector('.range-select')?.addEventListener('click', (ev) => {
        const b = ev.target.closest('button[data-val]');
        if (!b) return;
        li.setAttribute('data-range', b.getAttribute('data-val'));
        li.querySelectorAll('.range-select button').forEach(x => x.classList.remove('is-active'));
        b.classList.add('is-active');
      });

      // Start → #/exercise?id=...&range=...
      li.querySelector('.btn-start')?.addEventListener('click', () => {
        const id = li.getAttribute('data-id');
        const r  = li.getAttribute('data-range') || '10';
        window.location.hash = `#/exercise?id=${encodeURIComponent(id)}&range=${encodeURIComponent(r)}`;
      });
    });

    // Fallback-Navigation nach Abschluss:
    // Wenn dein Router/Play nicht selbst navigiert, geht's sicher zurück zur Übungsübersicht.
    if (!window.__ls_finishNavRegistered) {
      window.__ls_finishNavRegistered = true;
      window.addEventListener('cb:exercise:finished', () => {
        location.hash = '#/exercises';
      });
    }
  }
};
