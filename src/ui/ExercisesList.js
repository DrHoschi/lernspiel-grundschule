/* =============================================================
 * ui/ExercisesList.js — v0.1.1
 * Auswahl + Start echter Übungen.
 * ============================================================= */
import { Exercises } from '../data/exercises.js';

export const ExercisesList = {
  render(user) {
    const list = Exercises.list();
    const items = list.map(x => `
      <li class="panel">
        <div class="spread">
          <div>
            <strong>${x.title}</strong>
            <div class="badge">${x.subject} · Klasse ${x.grade}</div>
          </div>
          <div>
            <button class="btn-start" data-id="${x.id}">Start</button>
          </div>
        </div>
      </li>
    `).join('');
    return `
      <section class="panel">
        <h2>Übungen</h2>
        <ul style="list-style:none;padding:0;margin:0;display:grid;gap:12px;">
          ${items}
        </ul>
      </section>
    `;
  },
  bind(rootEl) {
    rootEl.querySelectorAll('.btn-start').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        // Router-Navigation per Hash
        window.location.hash = `#/exercise?id=${encodeURIComponent(id)}`;
      });
    });
  }
};
