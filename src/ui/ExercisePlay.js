/* ============================================================================
 * Datei   : src/ui/ExercisePlay.js
 * Version : v0.8.0 (2025-11-11)
 * Zweck   : Aufgaben-Spieler für add/sub/mul/div + gemischt
 *
 * Basis   : v0.6.1 (Multiplikation), vollständig rückwärtskompatibel
 * Neu     : Operator-agnostischer Generator, Division ohne Rest,
 *           Event "cb:exercise:finished", Fallback-Ergebnis-UI.
 * ========================================================================== */
import { Exercises } from '../data/exercises.js';
import { Storage } from '../lib/storage.js';
import { Achievements } from '../data/achievements.js';
import { Goals } from '../data/goals.js';
const STICKERS_KEY = 'lernspiel.stickers';

/* ----------------------------- Sticker-Helfer ----------------------------- */
function giveStickers(childName, exerciseId, reward){
  const db = Storage.get(STICKERS_KEY, {});
  if (!db[childName]) db[childName] = [];
  const ts = new Date().toISOString();

  if (reward.tier !== 'none'){
    db[childName].push({ ts, exerciseId, tier: reward.tier, tierIcon: reward.tierIcon, progress: false });
  }
  if (reward.progressSticker){
    db[childName].push({ ts, exerciseId, tier: 'progress', tierIcon: '🚀', progress: true });
  }
  Storage.set(STICKERS_KEY, db);
}

/* ----------------------------- Operatoren -------------------------------- */
const OP = {
  add: { sym: '＋', make(min,max){
      const a = rnd(min,max), b = rnd(min,max);
      return { a, b, result: a+b, text: `${a} + ${b} = ?`, opSymbol: '+' , key:`${a}+${b}` };
    }},
  sub: { sym: '−', make(min,max){
      let a = rnd(min,max), b = rnd(min,max);
      if (b>a) [a,b] = [b,a]; // keine negativen Ergebnisse
      return { a, b, result: a-b, text: `${a} - ${b} = ?`, opSymbol: '-' , key:`${a}-${b}` };
    }},
  mul: { sym: '×', make(min,max){
      const a = rnd(min,max), b = rnd(min,max);
      return { a, b, result: a*b, text: `${a} × ${b} = ?`, opSymbol: '×' , key:`${a}×${b}` };
    }},
  div: { sym: '÷', make(min,max){
      // c ÷ a = b (immer glatt)
      const a = rnd(min,max), b = rnd(min,max), c = a*b;
      return { a:c, b:a, result: b, text: `${c} ÷ ${a} = ?`, opSymbol: '÷' , key:`${c}÷${a}` };
    }}
};
function rnd(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

export const ExercisePlay = {
  _state: null,

  render({ user, exerciseId }) {
    const ex = Exercises.getById(exerciseId);
    if (!ex) {
      return `<section class="panel"><h2>Übung nicht gefunden</h2><p><a href="#/exercises">Zurück</a></p></section>`;
    }

    // Unterstützt ex.config.op ODER ex.config.ops (gemischt)
    const ops = Array.isArray(ex.config.ops) && ex.config.ops.length
      ? ex.config.ops
      : [ex.config.op || 'mul'];

    this._state = {
      user, ex, ops,
      total: ex.config.questions,
      min: ex.config.min, max: ex.config.max,
      asked: 0, correct: 0, wrong: 0,
      startTs: Date.now(), timeLimit: ex.config.timeLimitSec,
      items: [],           // {a,b,result,correct,timeMs,key,opSymbol}
      qStartTs: null,
      _timer: null,
      _finished: false
    };

    const q = this._nextQuestion(); // setzt qStartTs
    return `
      <section class="panel">
        <div class="spread">
          <h2>${ex.title}</h2>
          <div class="badge">Zeit: <span id="time-left">${ex.config.timeLimitSec}</span>s</div>
        </div>
        <p>Beantworte ${ex.config.questions} Aufgaben so schnell wie möglich.</p>

        <div id="exercise-area" class="grid" style="gap:16px;">
          <div class="panel">
            <div class="flex">
              <strong id="q-text" style="font-size:24px;">${q.text}</strong>
              <span class="badge">Aufgabe <span id="q-num">1</span> / ${ex.config.questions}</span>
            </div>
            <label for="answer">Antwort</label>
            <input id="answer" class="input" type="number" inputmode="numeric" placeholder="Zahl eingeben" />
            <div class="form-actions">
              <button id="btn-submit">Prüfen</button>
              <button id="btn-skip" class="ghost">Überspringen</button>
            </div>
            <p class="muted" style="color:var(--muted)">Tipp: schnelle Eingabe + Enter</p>
          </div>

          <div class="panel">
            <h3>Zwischenstand</h3>
            <p>✅ Richtig: <strong id="stat-correct">0</strong></p>
            <p>❌ Falsch: <strong id="stat-wrong">0</strong></p>
          </div>
        </div>
      </section>
    `;
  },

  bind(rootEl, { onFinish } = {}) {
    const timeEl   = rootEl.querySelector('#time-left');
    const answerEl = rootEl.querySelector('#answer');
    const submitBtn= rootEl.querySelector('#btn-submit');
    const skipBtn  = rootEl.querySelector('#btn-skip');

    const disableControls = () => {
      if (answerEl) answerEl.disabled = true;
      if (submitBtn) submitBtn.disabled = true;
      if (skipBtn)   skipBtn.disabled = true;
    };

    // Timer (Gesamt)
    const tick = () => {
      const gone = Math.floor((Date.now() - this._state.startTs) / 1000);
      const left = Math.max(0, this._state.timeLimit - gone);
      if (timeEl) timeEl.textContent = String(left);
      if (left <= 0) finish();
      else this._state._timer = requestAnimationFrame(tick);
    };
    this._state._timer = requestAnimationFrame(tick);

    submitBtn?.addEventListener('click', () => {
      this._checkAndRecord(answerEl.value);
      answerEl.value = ''; answerEl.focus();
    });
    answerEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { this._checkAndRecord(answerEl.value); answerEl.value = ''; }
    });
    skipBtn?.addEventListener('click', () => { this._record(false); });

    // === Robustes Finish ===
    const finish = () => {
      if (this._state._finished) return;
      this._state._finished = true;

      if (this._state?._timer) cancelAnimationFrame(this._state._timer);
      disableControls();

      const { user, ex, correct, wrong, startTs, items } = this._state;

      const stats = Exercises.saveAttempt({
        userName: user?.name || 'Kind',
        exerciseId: ex.id,
        correctCount: correct,
        wrongCount: wrong,
        playedAtISO: new Date().toISOString(),
        durationSec: Math.max(0, Math.round((Date.now() - startTs) / 1000)),
        items
      });

      // Medaillen-Stufe (wie vorher, nur hier berechnet)
      const tier = stats.ratio >= 90 ? 'gold' : (stats.ratio >= 75 ? 'silver' : (stats.ratio >= 60 ? 'bronze' : 'none'));
      const tierIcon = tier === 'gold' ? '🥇' : tier === 'silver' ? '🥈' : tier === 'bronze' ? '🥉' : '🎯';
      const progressSticker = stats.delta >= 10 ? '🚀 Fortschritt' : '';
      const reward = { tier, tierIcon, progressSticker, ratio: stats.ratio, delta: stats.delta, best: stats.bestRatio, streak: stats.streak, last5Avg: stats.last5Avg };

      // Sticker + bestehende Zähler/Goals (Backcompat)
      giveStickers(user?.name || 'Kind', ex.id, reward);
      Achievements.onRound(user?.name || 'Kind', reward, ex.id);
      Goals.onRound(user?.name || 'Kind', correct);

      const detail = { ex, correct, wrong, stats, reward };

      // a) Event für globalen Router/Listener
      window.dispatchEvent(new CustomEvent('cb:exercise:finished', { detail }));

      // b) Falls ein Callback übergeben wurde
      if (typeof onFinish === 'function') {
        onFinish(detail);
        return;
      }

      // c) Fallback-UI (keine Auto-Navigation; vermeidet 404)
      const area = rootEl.querySelector('#exercise-area');
      if (area){
        const ratio = (correct+wrong)>0 ? Math.round(100*correct/(correct+wrong)) : 0;
        area.innerHTML = `
          <div class="panel" style="grid-column:1/-1">
            <h3>Ergebnis</h3>
            <p><strong>${ex.title}</strong></p>
            <p>✅ Richtig: <strong>${correct}</strong> · ❌ Falsch: <strong>${wrong}</strong></p>
            <p>Trefferquote: <strong>${ratio}%</strong> · Bester Wert: <strong>${stats.bestRatio}%</strong></p>
            <div class="form-actions">
              <a class="button" href="#/exercises">Weitere Übungen</a>
              <a class="button ghost" href="#/rewards">Belohnungen</a>
            </div>
            <p class="muted">Hinweis: Du kannst global auf <code>cb:exercise:finished</code> hören und selbst navigieren.</p>
          </div>`;
      }
    };
    this._finish = finish;
  },

  // --- Helfer -------------------------------------------------------------
  _nextQuestion() {
    const type = this._pickOp();
    const q = OP[type].make(this._state.min, this._state.max);
    this._state.current = q;
    this._state.qStartTs = Date.now();
    return q;
  },
  _pickOp(){
    const ops = this._state.ops || ['mul'];
    return ops[Math.floor(Math.random()*ops.length)];
  },
  _checkAndRecord(raw){
    const val = Number(raw);
    const ok = Number.isFinite(val) && val === this._state.current.result;
    this._record(ok);
  },
  _record(ok){
    if (this._state._finished) return;
    const now = Date.now();
    const timeMs = Math.max(0, now - (this._state.qStartTs || now));
    const { a, b, result, key, opSymbol } = this._state.current;

    // Statistik
    this._state.asked += 1;
    if (ok) this._state.correct += 1; else this._state.wrong += 1;

    // Item für Persistenz (Backcompat + erweiterter key)
    this._state.items.push({ a, b, result, correct: !!ok, timeMs, key, opSymbol });

    // UI
    const sC = document.getElementById('stat-correct');
    const sW = document.getElementById('stat-wrong');
    if (sC) sC.textContent = String(this._state.correct);
    if (sW) sW.textContent = String(this._state.wrong);

    // Ende?
    if (this._state.asked >= this._state.total){
      this._finish && this._finish();
      return;
    }

    // Nächste Frage
    const qText = document.getElementById('q-text');
    const qNum  = document.getElementById('q-num');
    const q = this._nextQuestion();
    if (qText) qText.textContent = q.text;
    if (qNum)  qNum.textContent  = String(this._state.asked + 1);
  }
};
