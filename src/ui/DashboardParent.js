/* =============================================================
 * ui/DashboardParent.js — v0.5.0
 * Eltern-Dashboard (rein lokal):
 *  - Trendpfeile ↑ ↓, Delta in %, Bestwert, Streak
 *  - Letzte 5 Versuche: Durchschnitt
 * ============================================================= */
import { Exercises } from '../data/exercises.js';

function badgeDelta(delta){
  const sign = delta > 0 ? '+' : (delta < 0 ? '–' : '±');
  const cls  = delta > 0 ? 'good' : (delta < 0 ? 'bad' : 'muted');
  const arrow= delta > 0 ? '↑' : (delta < 0 ? '↓' : '→');
  const abs  = Math.abs(delta);
  return `<span class="badge" style="background:rgba(255,255,255,0.1);">${arrow} <span class="${cls}">${sign}${abs}%</span></span>`;
}
function cls(name){ return `style="color:var(--${name}); font-weight:700"`; }

export const DashboardParent = {
  render(/*user*/){
    // Platzhalter, bind() rendert async die echte Ansicht
    return `<section class="panel"><h2>Elternbereich</h2><p>Lade Statistik …</p></section>`;
  },

  async bind(rootEl){
    const data = Exercises.aggregateAllLocal();
    const { total, perChild } = data;

    const totalRatio = (total.correct + total.wrong) > 0
      ? Math.round(100 * total.correct / (total.correct + total.wrong))
      : 0;

    const html = `
      <section class="panel">
        <h2>Elternbereich</h2>
<p>
  <a href="#/stats" class="badge" style="display:inline-block; margin-top:6px;">📊 Details ansehen</a>
</p>
        <div class="grid two">
          <div class="panel">
            <h3>Gesamtleistung (alle Kinder)</h3>
            <p>Versuche: <strong>${total.attempts}</strong></p>
            <p>Richtig: <strong>${total.correct}</strong> · Falsch: <strong>${total.wrong}</strong></p>
            <p>Quote gesamt: <strong>${totalRatio}%</strong></p>
            <p>Zuletzt: <strong>${total.lastPlayedISO ? new Date(total.lastPlayedISO).toLocaleString() : '—'}</strong></p>
          </div>

          <div class="panel">
            <h3>Kinder</h3>
            <ul class="clean">
              ${
                perChild.length
                ? perChild.map(c => `
                    <li class="panel">
                      <div class="spread">
                        <div>
                          <strong>${c.child}</strong>
                          <div class="badge">Versuche: ${c.attempts} · Quote: ${c.ratio}%</div>
                          <div class="badge">Zuletzt: ${c.last ? new Date(c.last).toLocaleString() : '—'}</div>
                        </div>
                      </div>

                      <div style="margin-top:10px;">
                        <ul>
                          ${c.byEx.map(e => `
                            <li style="margin-bottom:8px;">
                              <div class="spread">
                                <div>
                                  <strong>${e.name}</strong>
                                  <div class="badge">Letzte: ${e.last}%</div>
                                  <div class="badge">Ø letzte 5: ${e.last5Avg}%</div>
                                  <div class="badge">Bestwert: ${e.best}%</div>
                                  <div class="badge">Streak: ${e.streak}x</div>
                                </div>
                                <div>
                                  ${badgeDelta(e.delta)}
                                </div>
                              </div>
                            </li>
                          `).join('')}
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

    const main = document.getElementById('app-main');
    if (main) main.querySelector('.layout-wrapper').innerHTML = html;
  }
};
