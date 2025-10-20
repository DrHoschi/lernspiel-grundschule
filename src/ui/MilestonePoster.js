/* ============================================================================
 * Datei   : src/ui/MilestonePoster.js
 * Version : v1.0.0
 * Zweck   : 3×3 Poster mit Meilensteinen (füllt sich, wenn erreicht)
 * ========================================================================== */
import { Achievements } from '../data/achievements.js';

const CELLS = [
  { id:'gold3',   label:'3× Gold',    icon:'🏆' },
  { id:'gold5',   label:'5× Gold',    icon:'🌟' },
  { id:'silver5', label:'5× Silber',  icon:'🥈' },
  { id:'bronze5', label:'5× Bronze',  icon:'🥉' },
  { id:'rocket3', label:'3× Rakete',  icon:'🚀' },
  { id:'speed10', label:'Speedrun 10',icon:'⏱️' },
  { id:'speed15', label:'Speedrun 15',icon:'⏱️' },
  { id:'speed20', label:'Speedrun 20',icon:'⏱️' },
  { id:'daily3',  label:'3 Tage Ziel',icon:'📆' },
];

export const MilestonePoster = {
  render({ user }){
    const ach = Achievements.get(user.name);
    const owned = new Set(ach.bonuses.map(b=>b.id));

    // Speedrun/Tageziele optional aus LocalStorage prüfen
    const extras = JSON.parse(localStorage.getItem('lernspiel.posterExtras')||'{}');
    if (extras.speed10) owned.add('speed10');
    if (extras.speed15) owned.add('speed15');
    if (extras.speed20) owned.add('speed20');
    if (extras.daily3 ) owned.add('daily3');

    return `
      <section class="panel">
        <div class="spread">
          <h2>Mein Meilenstein-Poster</h2>
          <a class="badge" href="#/child">← Zurück</a>
        </div>

        <div class="grid three" style="margin-top:8px;">
          ${CELLS.map(c=>{
            const got = owned.has(c.id);
            return `
              <div class="panel" style="text-align:center; ${got?'box-shadow:0 0 0 2px rgba(62,207,142,.6) inset':''}">
                <div style="font-size:28px;opacity:${got?1:.35}">${c.icon}</div>
                <div class="badge" style="margin-top:6px;opacity:${got?1:.5}">${c.label}</div>
                ${got?'<div class="badge" style="margin-top:6px;">✔️</div>':'<div class="badge" style="margin-top:6px;">—</div>'}
              </div>
            `;
          }).join('')}
        </div>

        <p style="margin-top:10px;">
          <a class="badge" href="#/kidbook">📘 Fortschrittsbuch</a>
          <a class="badge" href="#/superrun">⏱️ Speedrun</a>
        </p>
      </section>
    `;
  },
  bind(){ /* nix nötig */ }
};
