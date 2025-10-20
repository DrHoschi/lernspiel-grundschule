/* ============================================================================
 * Datei   : src/ui/TrainHard.js
 * Version : v0.1.0
 * Zweck   : Zieltraining für schwerste Aufgaben eines Kindes
 * Route   : #/train-hard?ex=<exerciseId>
 * ========================================================================== */
import { Exercises } from '../data/exercises.js';

function pickHardProblems(child, exId, n=10){
  const raw = Exercises.getRaw();
  const rec = raw?.[child]?.[exId];
  if (!rec || !rec.problems) return [];
  const arr = Object.entries(rec.problems).map(([k,pr])=>{
    const err = pr.total ? pr.wrong / pr.total : 0;
    const speed = pr.avgMs || 0;
    const [a,b] = k.split('x').map(Number);
    return { key:k, a, b, err, speed, total: pr.total };
  });
  // sortiere: erst Fehlerquote absteigend, dann langsamste
  arr.sort((x,y)=> (y.err - x.err) || (y.speed - x.speed) || (y.total - x.total));
  return arr.slice(0, n);
}

export const TrainHard = {
  _state:null,

  render({ user, exId }){
    const base = Exercises.getById(exId) || Exercises.getById('m-multiplication-2to10');
    const hard = pickHardProblems(user.name, base.id, 10);
    if (!hard.length){
      return `<section class="panel"><h2>Trainingsmodus</h2><p>Super! Es gibt derzeit keine auffälligen Aufgaben. Spiele zuerst ein paar Runden, damit ich deine schwierigsten Aufgaben erkennen kann.</p><p><a href="#/exercises">Zu den Übungen</a></p></section>`;
    }
    // Baue eine feste Reihenfolge mit Wiederholung, falls <10 vorhanden
    const pool = [];
    while (pool.length < 10) pool.push(...hard);
    const items = pool.slice(0,10);

    this._state = {
      user, exId: `${base.id}-hard`, items,
      idx: 0, correct:0, wrong:0, startTs: Date.now(), qStartTs: Date.now(), answers:[]
    };

    const cur = items[0];
    return `
      <section class="panel">
        <div class="spread">
          <h2>Trainingsmodus: schwerste Aufgaben</h2>
          <div class="badge">Aufgabe <span id="q-num">1</span> / 10</div>
        </div>
        <p>Gezieltes Üben deiner zuletzt schwersten Aufgaben für „${base.title}“.</p>

        <div class="panel">
          <div class="flex">
            <strong id="q-text" style="font-size:24px;">${cur.a} × ${cur.b} = ?</strong>
          </div>
          <label for="answer">Antwort</label>
          <input id="answer" class="input" type="number" inputmode="numeric" placeholder="Zahl eingeben" />
          <div class="form-actions">
            <button id="btn-submit">Prüfen</button>
            <button id="btn-skip" class="ghost">Überspringen</button>
          </div>
        </div>

        <div class="panel">
          <h3>Zwischenstand</h3>
          <p>✅ <strong id="stat-c">0</strong> · ❌ <strong id="stat-w">0</strong></p>
        </div>
      </section>
    `;
  },

  bind(rootEl, { onFinish }){
    const answer = rootEl.querySelector('#answer');
    const btnS   = rootEl.querySelector('#btn-submit');
    const btnK   = rootEl.querySelector('#btn-skip');

    const next = ()=>{
      this._state.idx++;
      if (this._state.idx >= 10) return finish();
      const cur = this._state.items[this._state.idx];
      document.getElementById('q-text').textContent = `${cur.a} × ${cur.b} = ?`;
      document.getElementById('q-num').textContent  = String(this._state.idx+1);
      this._state.qStartTs = Date.now();
      answer.value = '';
      answer.focus();
    };

    const record = (ok)=>{
      const now = Date.now();
      const t = Math.max(0, now - (this._state.qStartTs||now));
      const cur = this._state.items[this._state.idx];
      this._state.answers.push({ a:cur.a, b:cur.b, result:cur.a*cur.b, correct:!!ok, timeMs:t });
      if (ok) this._state.correct++; else this._state.wrong++;
      document.getElementById('stat-c').textContent = String(this._state.correct);
      document.getElementById('stat-w').textContent = String(this._state.wrong);
      next();
    };

    btnS.addEventListener('click', ()=>{
      const val = Number(answer.value);
      const cur = this._state.items[this._state.idx];
      record(Number.isFinite(val) && val === cur.a*cur.b);
    });
    btnK.addEventListener('click', ()=> record(false));
    answer.addEventListener('keydown', (e)=>{
      if (e.key==='Enter'){
        const val = Number(answer.value);
        const cur = this._state.items[this._state.idx];
        record(Number.isFinite(val) && val === cur.a*cur.b);
      }
    });

    const finish = ()=>{
      const { user, exId, correct, wrong, startTs, answers } = this._state;
      const stats = Exercises.saveAttempt({
        userName: user.name, exerciseId: exId,
        correctCount: correct, wrongCount: wrong,
        playedAtISO: new Date().toISOString(),
        durationSec: Math.max(0, Math.round((Date.now()-startTs)/1000)),
        items: answers
      });

      // einfache Belohnungslogik wie im normalen Modus:
      const tier = stats.ratio >= 90 ? 'gold' : (stats.ratio >= 75 ? 'silver' : (stats.ratio >= 60 ? 'bronze' : 'none'));
      const tierIcon = tier === 'gold' ? '🥇' : tier === 'silver' ? '🥈' : tier === 'bronze' ? '🥉' : '🎯';
      const progressSticker = stats.delta >= 10 ? '🚀 Fortschritt' : '';
      const reward = { tier, tierIcon, progressSticker, ratio: stats.ratio, delta: stats.delta, best: stats.bestRatio, streak: stats.streak, last5Avg: stats.last5Avg };

      onFinish && onFinish({ ex:{ id:exId, title:'Training: schwerste Aufgaben' }, correct, wrong, stats, reward });
    };
  }
};
