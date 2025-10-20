/* =============================================================
 * Datei : src/ui/DashboardParent.js
 * Version: v0.6.2-sec
 * Neu    : Anzeige von Durchschnittszeiten in Sekunden (statt ms)
 * ============================================================= */
import { Exercises } from '../data/exercises.js';

function toCSV(rows){
  const esc = v => {
    const s = (v==null?'':String(v)).replace(/"/g,'""');
    return `"${s}"`;
  };
  return rows.map(r=> r.map(esc).join(';')).join('\n');
}

function exportRoundsCSV(){
  const raw = Exercises.getRaw();
  const rows = [
    // Hinweis: CSV kann auf Wunsch ebenfalls auf Sekunden umgestellt werden.
    ['Kind','Übung','Datum','Quote%','Richtig','Falsch','Dauer_s','Ø_ms','Median_ms']
  ];
  Object.entries(raw).forEach(([child, exs])=>{
    Object.entries(exs).forEach(([exId, rec])=>{
      const title = Exercises.getById(exId)?.title || exId;
      (rec.history||[]).forEach(h=>{
        rows.push([child, title, new Date(h.ts).toLocaleString(), h.ratio, h.correct, h.wrong, h.durationSec||0, h.avgMs||0, h.medianMs||0]);
      });
    });
  });
  const blob = new Blob([toCSV(rows)], { type:'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'lernspiel_runden.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}

function exportProblemsCSV(){
  const raw = Exercises.getRaw();
  const rows = [
    ['Kind','Übung','Aufgabe','Versuche','Fehler','Fehler%','Ø_ms','Median_ms','Best_ms','Letzte_ms']
  ];
  Object.entries(raw).forEach(([child, exs])=>{
    Object.entries(exs).forEach(([exId, rec])=>{
      const title = Exercises.getById(exId)?.title || exId;
      const probs = rec.problems||{};
      Object.entries(probs).forEach(([key, pr])=>{
        const err = pr.total ? Math.round(100*pr.wrong/pr.total) : 0;
        rows.push([child, title, key.replace('x',' × '), pr.total, pr.wrong, err, pr.avgMs||0, pr.medianMs||0, pr.bestMs||0, pr.lastMs||0]);
      });
    });
  });
  const blob = new Blob([toCSV(rows)], { type:'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'lernspiel_aufgaben.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}

function badgeDelta(delta){
  const sign = delta>0?'+':(delta<0?'–':'±');
  const arrow= delta>0?'↑':(delta<0?'↓':'→');
  const abs = Math.abs(delta);
  return `<span class="badge" style="background:rgba(255,255,255,0.1);">${arrow} ${sign}${abs}%</span>`;
}

export const DashboardParent = {
  render(){
    return `<section class="panel"><h2>Elternbereich</h2><p>Lade Statistik …</p></section>`;
  },

  async bind(rootEl){
    const data = Exercises.aggregateAllLocal();
    const { total, perChild } = data;
    const totalRatio = (total.correct + total.wrong) > 0 ? Math.round(100*total.correct/(total.correct+total.wrong)) : 0;

    const html = `
      <section class="panel">
        <div class="spread">
          <h2>Elternbereich</h2>
          <div class="flex">
            <button id="btn-csv-rounds" class="ghost">📥 CSV Runden</button>
            <button id="btn-csv-problems" class="ghost">📥 CSV Aufgaben</button>
            <a href="#/stats" class="badge">📊 Details</a>
          </div>
        </div>

        <div class="grid two" style="margin-top:8px;">
          <div class="panel">
            <h3>Gesamt</h3>
            <p>Versuche: <strong>${total.attempts}</strong></p>
            <p>Richtig: <strong>${total.correct}</strong> · Falsch: <strong>${total.wrong}</strong></p>
            <p>Quote: <strong>${totalRatio}%</strong></p>
            <p>Zuletzt: <strong>${total.lastPlayedISO ? new Date(total.lastPlayedISO).toLocaleString() : '—'}</strong></p>
          </div>

          <div class="panel">
            <h3>Kinder</h3>
            <ul class="clean">
              ${
                perChild.length ? perChild.map(c=>`
                  <li class="panel">
                    <div class="spread">
                      <div>
                        <strong>${c.child}</strong>
                        <div class="badge">Versuche: ${c.attempts}</div>
                        <div class="badge">Quote: ${c.ratio}%</div>
                        <div class="badge">Zuletzt: ${c.last ? new Date(c.last).toLocaleString() : '—'}</div>
                      </div>
                    </div>
                    <div style="margin-top:8px;">
                      <ul>
                        ${c.byEx.map(e=>{
                          const dur5s = ((e.durAvg5||0)/1000).toFixed(1);
                          return `
                            <li class="spread" style="margin-bottom:6px;">
                              <div>
                                <strong>${e.name}</strong>
                                <div class="badge">Letzte: ${e.last}%</div>
                                <div class="badge">Ø5: ${e.last5Avg}%</div>
                                <div class="badge">Best: ${e.best}%</div>
                                <div class="badge">Ø Zeit(5): ${dur5s} s</div>
                              </div>
                              <div>${badgeDelta(e.delta)}</div>
                            </li>
                          `;
                        }).join('')}
                      </ul>
                    </div>
                  </li>
                `).join('') : '<li>Keine Spieldaten.</li>'
              }
            </ul>
          </div>
        </div>
      </section>
    `;

    const main = document.getElementById('app-main');
    if (main) main.querySelector('.layout-wrapper').innerHTML = html;

    // CSV
    main.querySelector('#btn-csv-rounds')?.addEventListener('click', exportRoundsCSV);
    main.querySelector('#btn-csv-problems')?.addEventListener('click', exportProblemsCSV);
  }
};
