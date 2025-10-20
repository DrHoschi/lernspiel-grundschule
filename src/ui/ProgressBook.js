/* ============================================================================
 * Datei   : src/ui/ProgressBook.js
 * Version : v1.0.1
 * Zweck   : Kindgerechtes Journal mit Verlauf (Quote & Ø-Zeit in Sekunden), Lob-Texten
 * Hinweis : Anzeige von Ø/Median jetzt in s (eine Nachkommastelle), Diagramm skaliert auf Sekunden.
 * ========================================================================== */
import { Exercises } from '../data/exercises.js';

function drawChart(canvas, ratios, avgMsArray){
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);

  const pad = { l:36, r:12, t:12, b:22 };
  const w = W - pad.l - pad.r;
  const h = H - pad.t - pad.b;

  // X und Y-Skalen
  const x = i => pad.l + (w * (i / Math.max(1, ratios.length - 1)));
  const y1 = v => pad.t + h * (1 - v / 100); // Quote in %

  // Ø-Zeit in Sekunden skalieren
  const avgSec = avgMsArray.map(ms => (ms || 0) / 1000);
  const maxAvgSec = Math.max(2, ...avgSec, 0); // min. 2s, damit die Linie sichtbar bleibt
  const y2 = vSec => pad.t + h * (1 - (vSec / Math.max(1, maxAvgSec)));

  // Grid (für Quote in %)
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  [0, 25, 50, 75, 100].forEach(p => {
    const yy = y1(p);
    ctx.beginPath(); ctx.moveTo(pad.l, yy); ctx.lineTo(W - pad.r, yy); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '12px system-ui';
    ctx.fillText(`${p}%`, 4, yy + 4);
  });

  // Linie: Quote (%)
  ctx.strokeStyle = 'rgba(74,163,255,0.95)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ratios.forEach((v, i) => {
    const xx = x(i), yy = y1(v);
    i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
  });
  ctx.stroke();

  // Linie: Ø-Zeit (Sekunden, gestrichelt)
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = 'rgba(62,207,142,0.95)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  avgSec.forEach((sec, i) => {
    const xx = x(i), yy = y2(sec);
    i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
  });
  ctx.stroke();
  ctx.setLineDash([]);
}

function praise(last, prev){
  if (prev == null) return 'Super Start! 🎉';
  const d = last - prev;
  if (d >= 10) return 'Wow, riesiger Sprung! 🚀';
  if (d >= 5)  return 'Stark verbessert! 💪';
  if (d >= 1)  return 'Ein kleines Stück besser – weiter so! 🙂';
  if (d === 0) return 'Gleichbleibend – bleib dran! 🔁';
  return 'Kein Problem – beim nächsten Mal klappt es! 🌱';
}

export const ProgressBook = {
  render({ user }){
    // Nimm die Standard-Übung, optional später Auswahl
    const raw = Exercises.getRaw();
    const exIds = Object.keys(raw[user.name] || {});
    const exId  = exIds[0] || 'm-multiplication-2to10';
    const rec   = raw?.[user.name]?.[exId];

    if (!rec || !(rec.history?.length)){
      return `
        <section class="panel">
          <h2>Mein Fortschrittsbuch</h2>
          <p>Noch keine Einträge – starte eine Übung!</p>
          <p><a href="#/exercises">Übungen starten</a></p>
        </section>`;
    }

    const hist   = [...rec.history].reverse(); // chronologisch
    const ratios = hist.map(h => h.ratio || 0);
    const avgsMs = hist.map(h => h.avgMs || 0);

    const last = hist.at(-1)?.ratio ?? 0;
    const prev = hist.length > 1 ? hist.at(-2).ratio : null;

    return `
      <section class="panel">
        <div class="spread">
          <h2>Mein Fortschrittsbuch</h2>
          <div class="flex">
            <a class="badge" href="#/child">← Zurück</a>
            <a class="badge" href="#/poster">🏆 Poster</a>
          </div>
        </div>

        <div class="grid two" style="margin-top:8px;">
          <div class="panel">
            <h3>Mein Verlauf</h3>
            <canvas id="kid-chart" width="520" height="220" style="width:100%;height:220px;"></canvas>
            <p class="muted" style="color:var(--muted);margin-top:4px;">Blaue Linie: Quote (%), gestrichelte grüne Linie: Ø-Zeit pro Aufgabe (Sekunden)</p>
            <p style="margin-top:6px;">${praise(last, prev)}</p>
          </div>

          <div class="panel">
            <h3>Letzte Runden</h3>
            <ul class="clean">
              ${rec.history.slice(0, 8).map(h => `
                <li class="panel">
                  <div class="spread">
                    <strong>${new Date(h.ts).toLocaleString()}</strong>
                    <span class="badge">${h.ratio}%</span>
                  </div>
                  <div class="badge">Dauer: ${h.durationSec || 0}s</div>
                  <div class="badge">Ø pro Aufgabe: ${( (h.avgMs||0) / 1000 ).toFixed(1)} s · Median: ${( (h.medianMs||0) / 1000 ).toFixed(1)} s</div>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>

        <p style="margin-top:10px;">
          <a class="badge" href="#/train-hard?ex=${exId}">🎯 Trainiere meine schwersten Aufgaben</a>
          <a class="badge" href="#/superrun?ex=${exId}">⏱️ Speedrun (60s)</a>
        </p>
      </section>
    `;
  },

  bind(rootEl){
    // Diagramm zeichnen
    const c = rootEl.querySelector('#kid-chart');
    const raw = Exercises.getRaw();

    import('../auth/auth.js').then(({ Auth }) => {
      const u = Auth.currentUser(); if (!u) return;
      const exIds = Object.keys(raw[u.name] || {});
      const exId  = exIds[0] || 'm-multiplication-2to10';
      const rec   = raw?.[u.name]?.[exId];
      if (!rec || !c) return;
      const hist = [...rec.history].reverse();
      drawChart(
        c,
        hist.map(h => h.ratio || 0),
        hist.map(h => h.avgMs || 0)  // drawChart rechnet intern auf Sekunden um
      );
    });
  }
};
