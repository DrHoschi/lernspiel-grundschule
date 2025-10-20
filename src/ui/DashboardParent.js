/* =============================================================
 * ui/DashboardParent.js — v0.3.0
 * Eltern-Dashboard:
 *  1) Versucht /stats vom Server zu laden (aggregiert)
 *  2) Fällt auf lokale Aggregation zurück (lernspiel.progress)
 * ============================================================= */
import { Exercises } from '../data/exercises.js';
import { Storage } from '../lib/storage.js';
import { CONFIG } from '../config.js';

const PROGRESS_KEY = 'lernspiel.progress';

function aggregateLocal(){
  const db = Storage.get(PROGRESS_KEY, {}); // { childName: { exId: { ... } } }
  const childNames = Object.keys(db);
  const total = { attempts: 0, correct: 0, wrong: 0, lastPlayedISO: null };

  childNames.forEach(child => {
    Object.values(db[child]).forEach(s => {
      total.attempts += s.attempts || 0;
      total.correct  += s.correct  || 0;
      total.wrong    += s.wrong    || 0;
      if (s.lastPlayedISO && (!total.lastPlayedISO || s.lastPlayedISO > total.lastPlayedISO)) {
        total.lastPlayedISO = s.lastPlayedISO;
      }
    });
  });

  const perChild = childNames.map(child => {
    const entries = db[child];
    let cAttempts = 0, cCorrect = 0, cWrong = 0, cLast = null;
    const byEx = Object.entries(entries).map(([exId, s]) => {
      const def = Exercises.getById(exId);
      const name = def ? def.title : exId;
      const r = (s.correct + s.wrong) > 0 ? Math.round(100 * s.correct / (s.correct + s.wrong)) : 0;
      cAttempts += s.attempts || 0;
      cCorrect  += s.correct  || 0;
      cWrong    += s.wrong    || 0;
      if (s.lastPlayedISO && (!cLast || s.lastPlayedISO > cLast)) cLast = s.lastPlayedISO;
      return { exId, name, ...s, ratio: r };
    });
    const ratio = (cCorrect + cWrong) > 0 ? Math.round(100 * cCorrect / (cCorrect + cWrong)) : 0;
    return { child, attempts: cAttempts, correct: cCorrect, wrong: cWrong, ratio, last: cLast, byEx };
  });

  return { total, perChild };
}

function renderView(user, data, source){
  const { total, perChild } = data;
  const totalRatio = (total.correct + total.wrong) > 0
    ? Math.round(100 * total.correct / (total.correct + total.wrong))
    : 0;

  return `
    <section class="panel">
      <h2>Elternbereich</h2>
      <p>Willkommen, ${user.name || 'Eltern'}! Quelle: <span class="badge">${source}</span></p>

      <div class="grid two">
        <div class="panel">
          <h3>Gesamtleistung (alle Kinder)</h3>
          <p>Versuche: <strong>${total.attempts}</strong></p>
          <p>Richtig: <strong>${total.correct}</strong> · Falsch: <strong>${total.wrong}</strong></p>
          <p>Quote: <strong>${totalRatio}%</strong></p>
          <p>Zuletzt gespielt: <strong>${total.lastPlayedISO ? new Date(total.lastPlayedISO).toLocaleString() : '—'}</strong></p>
        </div>

        <div class="panel">
          <h3>Kinder</h3>
          <ul class="clean">
            ${
              (perChild && perChild.length)
              ? perChild.map(c => `
                  <li class="panel">
                    <div class="spread">
                      <div>
                        <strong>${c.child}</strong>
                        <div class="badge">Versuche: ${c.attempts} · Quote: ${c.ratio}%</div>
                        <div class="badge">Zuletzt: ${c.last ? new Date(c.last).toLocaleString() : '—'}</div>
                      </div>
                    </div>
                    <div style="margin-top:8px;">
                      <ul>
                        ${
                          c.byEx.map(e => `<li>${e.name}: ${e.attempts} Versuche · ${e.ratio}% richtig</li>`).join('')
                        }
                      </ul>
                    </div>
                  </li>
                `).join('')
              : '<li>Keine Spieldaten gefunden.</li>'
            }
          </ul>
        </div>
      </div>
    </section>
  `;
}

export const DashboardParent = {
  async renderAsync(user){
    // 1) Server versuchen
    if (CONFIG.API_BASE) {
      try {
        const { API } = await import('../lib/api.js');
        const resp = await API.getStats({ token: null });
        // Erwartete Serverform:
        // { total: {attempts, correct, wrong, lastPlayedISO}, perChild: [{child, attempts, correct, wrong, ratio, last, byEx: [{exId,name,attempts,correct,wrong,ratio}]}] }
        return renderView(user, resp, 'Server');
      } catch (e) {
        console.warn('[stats] Server nicht verfügbar, nutze lokal:', e.message);
      }
    }
    // 2) Lokal aggregieren
    const local = aggregateLocal();
    return renderView(user, local, 'Lokal');
  },

  render(user){ return `<section class="panel"><p>Lade Statistik …</p></section>`; },

  async bind(rootEl, user){
    const html = await this.renderAsync(user);
    // WICHTIG: wir ersetzen nur den INNERHALB layout-wrapper gerenderten Bereich
    const main = document.getElementById('app-main');
    if (main) main.querySelector('.layout-wrapper').innerHTML = html;
  }
};
