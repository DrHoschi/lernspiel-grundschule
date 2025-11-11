/* ============================================================================
 * Datei   : src/ui/ExercisePlay.js
 * Version : v0.9.0 (2025-11-11)
 * Zweck   : Verallgemeinerter Aufgabenspieler (add/sub/mul/div + gemischt)
 *
 * Neu in v0.9.0
 * - Operator-agnostischer Generator (op oder ops[])
 * - Division ohne Rest: c ÷ a = b (mit c = a*b)
 * - Subtraktion ohne negative Ergebnisse
 * - UI-Text dynamisch je Aufgabe
 * - Robuster Finish-Schutz bleibt erhalten
 *
 * Sticker/Achievements/Goals unverändert weiter nutzbar.
 * ========================================================================== */
import { Exercises } from '../data/exercises.js';
import { Storage } from '../lib/storage.js';
import { Achievements } from '../data/achievements.js';
import { Goals } from '../data/goals.js';
const STICKERS_KEY = 'lernspiel.stickers';

/* ---- Sticker-Helfer (unverändert) -------------------------------------- */
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

/* ---- Operator-Mapping --------------------------------------------------- */
const OP = {
  add: { sym: '＋', make(min,max){
      const a = rand(min,max), b = rand(min,max);
      return { a, b, op: 'add', opSymbol: '+', text: `${a} + ${b} = ?`, result: a+b, key:`${a}+${b}` };
    }},
  sub: { sym: '−', make(min,max){
      let a = rand(min,max), b = rand(min,max);
      if (b>a) [a,b] = [b,a]; // keine negativen Ergebnisse
      return { a, b, op: 'sub', opSymbol: '-', text: `${a} - ${b} = ?`, result: a-b, key:`${a}-${b}` };
    }},
  mul: { sym: '×', make(min,max){
      const a = rand(min,max), b = rand(min,max);
      return { a, b, op: 'mul', opSymbol: '×', text: `${a} × ${b} = ?`, result: a*b, key:`${a}×${b}` };
    }},
  div: { sym: '÷', make(min,max){
      // c ÷ a = b  (mit c = a*b, damit immer ganzzahlig)
      const a = rand(min,max), b = rand(min,max), c = a*b;
      return { a:c, b:a, op: 'div', opSymbol: '÷', text: `${c} ÷ ${a} = ?`, result: b, key:`${c}÷${a}` };
    }}
};
function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

export const ExercisePlay = {
  _state: null,

  render({ user, exerciseId }) {
    const ex = Exercises.getById(exerciseId) || Exercises.getById('m-multiplication-2to10');

    // Operatorquelle bestimmen
    const ops = Array.isArray(ex.config.ops) && ex.config.ops.length
      ? ex.config.ops
      : [ex.config.op || 'mul'];

    this._state = {
      user, ex,
      ops,
      min: ex.config.min, max: ex.config.max,
      total: ex.config.questions,
      asked: 0, correct: 0, wrong: 0,
      startTs: Date.now(), timeLimit: ex.config.timeLimitSec,
      items: [],           // {a,b,op,opSymbol,result,correct,timeMs,key}
      qStartTs: null,
      _timer: null,
      _finished: false
    };
    const q = this._nextQuestion();

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

  bind(rootEl, { onFinish }) {
    const timeEl   = rootEl.querySelector('#time-left');
    const answerEl = rootEl.querySelector('#answer');
    const submitBtn= rootEl.querySelector('#btn-submit');
    const skipBtn  = rootEl.querySelector('#btn-skip');

    // Timer (Gesamt)
    const tick = () => {
      const left = Math.max(0, this._state.timeLimit - Math.floor((Date.now() - this._state.startTs)/1000));
      if (timeEl) timeEl.textContent = String(left);
      if (left <= 0) { finish(); return; }
      this._state._timer = requestAnimationFrame(tick);
    };
    tick();

    // Eingaben
    answerEl?.focus();
    submitBtn.addEventListener('click', () => {
      this._checkAndRecord(answerEl.value);
      answerEl.value = '';
      answerEl.focus();
    });
    answerEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this._checkAndRecord(answerEl.value);
        answerEl.value = '';
      }
    });
    skipBtn.addEventListener('click', () => {
      this._record(false); // falsche Antwort ohne Eingabe
    });

    // === Robustes Finish ===
    const finish = () => {
      if (this._state._finished) return;
      this._state._finished = true;

      if (this._state?._timer) cancelAnimationFrame(this._state._timer);

      // Controls deaktivieren
      answerEl && (answerEl.disabled = true);
      submitBtn && (submitBtn.disabled = true);
      skipBtn && (skipBtn.disabled = true);

      const { user, ex, correct, wrong, startTs, items } = this._state;

      const stats = Exercises.saveAttempt({
        userName: user.name || 'Kind',
        exerciseId: ex.id,
        correctCount: correct,
        wrongCount: wrong,
        playedAtISO: new Date().toISOString(),
        durationSec: Math.max(0, Math.round((Date.now() - startTs) / 1000)),
        items
      });

      // einfache Belohnungslogik wie gehabt
      const reward = Achievements.evaluate(ex.id, stats);
      giveStickers(user.name || 'Kind', ex.id, reward);
      Goals.updateProgress(user.name || 'Kind', ex.id, stats);

      onFinish && onFinish({ ex, correct, wrong, stats, reward });
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
    const { a, b, op, opSymbol, result, text, key } = this._state.current;

    // Statistik aktualisieren
    this._state.asked += 1;
    if (ok) this._state.correct += 1; else this._state.wrong += 1;

    // Item speichern
    this._state.items.push({ a, b, op, opSymbol, result, correct: !!ok, timeMs, text, key });

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
