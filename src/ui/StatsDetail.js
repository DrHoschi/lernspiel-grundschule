/* ============================================================================
 * Datei   : src/ui/StatsDetail.js
 * Version : v0.6.1-sec
 * Zweck   : Eltern-Detailstatistik mit Sekunden-Anzeige
 * ========================================================================== */
import { Exercises } from '../data/exercises.js';

function drawChart(canvas, pointsA, pointsB_ms, labels){
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);

  const padL = 36, padR = 12, padT = 12, padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const x = i => padL + (plotW * (i / Math.max(1, pointsA.length - 1)));
  const yA = v => padT + (plotH * (1 - (v / 100))); // Quote %

  // Zeit in Sekunden skalieren
  const pointsB = pointsB_ms.map(ms => (ms||0)/1000);
  const maxB = Math.max(2, ...pointsB, 0); // mind. 2s
  const yB = vSec => padT + (plotH * (1 - (vSec / Math.max(1, maxB))));

  // Gitter (Quote)
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  [0,25,50,75,100].forEach(p=>{
    const yy = yA(p);
    ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(W - padR, yy); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '12px system-ui';
    ctx.fillText(`${p}%`, 4, yy+4);
  });

  // Linie A: Quote
  ctx.strokeStyle = 'rgba(74,163,255,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  pointsA.forEach((v,i)=>{ const xx=x(i), yy=yA(v); i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy); });
  ctx.stroke();

  // Linie B: Ø-Zeit (Sekunden)
  ctx.strokeStyle = 'rgba(62,207,142,0.9)';
  ctx.setLineDash([4,3]); ctx.lineWidth = 2;
  ctx.beginPath();
  pointsB.forEach((vSec,i)=>{ const xx=x(i), yy=yB(vSec); i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy); });
  ctx.stroke();
  ctx.setLineDash([]);

  // X-Labels (max 10)
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '12px system-ui';
  const step = Math.ceil(labels.length/10);
  labels.forEach((lab,i)=>{ if(i%step!==0) return; const xx=x(i); ctx.fillText(`${lab}`, xx-10, H-6); });
}

export const StatsDetail = {
  _state: { child: '', exId: '' },

  render(){
    const raw = Exercises.getRaw();
    const children = Object.keys(raw);
    const firstChild = children[0] || '';
    const exIds = firstChild ? Object.keys(raw[firstChild]||{}) : [];
    const firstEx = exIds[0] || 'm-multiplication-2to10';

    this._state.child = firstChild;
    this._state.exId  = firstEx;

    return `
      <section class="panel">
        <h2>Detailstatistik</h2>

        <div class="grid two">
          <div class="panel">
            <label>Kind</label>
            <select id="sel-child" class="input">
              ${children.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>

            <label style="margin-top:8px;">Übung</label>
            <select id="sel-ex" class="input">
              ${exIds.map(e => `<option value="${e}">${(Exercises.getById(e)?.title||e)}</option>`).join('')}
            </select>

            <div class="form-actions" style="margin-top:10px;">
              <button id="btn-refresh">Aktualisieren</button>
            </div>
          </div>

          <div class="panel">
            <h3>Verlauf (Quote % & Ø-Zeit je Aufgabe in s)</h3>
            <canvas id="chart" width="520" height="200" style="width:100%; height:200px;"></canvas>
          </div>
        </div>

        <div class="grid two" style="margin-top:12px;">
          <div class="panel">
            <h3>Letzte Runden</h3>
            <div id="tbl-rounds"></div>
          </div>
          <div class="panel">
            <h3>Schwierigste Aufgaben (Top 10)</h3>
            <div id="tbl-problems"></div>
          </div>
        </div>
      </section>
    `;
  },

  bind(rootEl){
    const selChild = rootEl.querySelector('#sel-child');
    const selEx    = rootEl.querySelector('#sel-ex');
    const btn      = rootEl.querySelector('#btn-refresh');

    const refreshExercises = ()=>{
      const raw = Exercises.getRaw();
      const exIds = Object.keys(raw[this._state.child]||{});
      selEx.innerHTML = exIds.map(e => `<option value="${e}">${(Exercises.getById(e)?.title||e)}</option>`).join('');
      if (!exIds.includes(this._state.exId)) this._state.exId = exIds[0]||'';
    };

    selChild?.addEventListener('change', ()=>{ this._state.child = selChild.value; refreshExercises(); this._renderData(rootEl); });
    selEx?.addEventListener('change', ()=>{ this._state.exId = selEx.value; this._renderData(rootEl); });
    btn?.addEventListener('click', ()=> this._renderData(rootEl));

    this._renderData(rootEl);
  },

  _renderData(rootEl){
    const raw = Exercises.getRaw();
    const rec = raw?.[this._state.child]?.[this._state.exId];
    const chart = rootEl.querySelector('#chart');
    const roundsEl = rootEl.querySelector('#tbl-rounds');
    const probsEl  = rootEl.querySelector('#tbl-problems');

    if (!rec){
      roundsEl.innerHTML = '<p>Keine Daten vorhanden.</p>';
      probsEl.innerHTML  = '<p>Keine Daten vorhanden.</p>';
      const ctx = chart.getContext('2d'); ctx.clearRect(0,0,chart.width,chart.height);
      return;
    }

    // Verlauf (neueste zuerst) → für Chronologie invertieren
    const hist = [...(rec.history||[])].reverse();
    const labels  = hist.map((h,i)=> String(i+1));
    const ratios  = hist.map(h=> h.ratio||0);
    const avgMs   = hist.map(h=> h.avgMs||0);
    drawChart(chart, ratios, avgMs, labels);

    // Letzte Runden Tabelle (Sekunden)
    const fmtS = ms => ((ms||0)/1000).toFixed(1) + ' s';
    roundsEl.innerHTML = `
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr>
          <th style="text-align:left;">#</th>
          <th style="text-align:left;">Datum</th>
          <th>Quote</th>
          <th>Dauer (s)</th>
          <th>Ø/Aufg. (s)</th>
          <th>Median (s)</th>
        </tr></thead>
        <tbody>
          ${ (rec.history||[]).map((h,idx)=>`
            <tr>
              <td>${idx+1}</td>
              <td>${new Date(h.ts).toLocaleString()}</td>
              <td style="text-align:center;">${h.ratio}%</td>
              <td style="text-align:center;">${h.durationSec||0}</td>
              <td style="text-align:center;">${fmtS(h.avgMs)}</td>
              <td style="text-align:center;">${fmtS(h.medianMs)}</td>
            </tr>
          `).join('') }
        </tbody>
      </table>
    `;

    // Schwierigste Aufgaben (Sekunden)
    const probs = Object.entries(rec.problems||{}).map(([key,pr])=>{
      const err = pr.total ? Math.round(100*pr.wrong/pr.total) : 0;
      return {
        key, err, total: pr.total,
        avg: ((pr.avgMs||0)/1000),
        med: ((pr.medianMs||0)/1000),
        best: ((pr.bestMs||0)/1000),
        last: ((pr.lastMs||0)/1000)
      };
    }).sort((a,b)=> b.err - a.err || (b.avg - a.avg)).slice(0,10);

    probsEl.innerHTML = probs.length ? `
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr>
          <th style="text-align:left;">Aufgabe</th>
          <th>Fehler%</th>
          <th>Vers.</th>
          <th>Ø (s)</th>
          <th>Median (s)</th>
          <th>Best (s)</th>
          <th>Letzte (s)</th>
        </tr></thead>
        <tbody>
          ${probs.map(p=>`
            <tr>
              <td>${p.key.replace('x',' × ')}</td>
              <td style="text-align:center;">${p.err}%</td>
              <td style="text-align:center;">${p.total}</td>
              <td style="text-align:center;">${p.avg.toFixed(1)}</td>
              <td style="text-align:center;">${p.med.toFixed(1)}</td>
              <td style="text-align:center;">${p.best.toFixed(1)}</td>
              <td style="text-align:center;">${p.last.toFixed(1)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p>Keine auffälligen Aufgaben.</p>';
  }
};
