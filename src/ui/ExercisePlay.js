/* ============================================================================
 * Datei   : src/ui/ExercisePlay.js
 * Version : v0.6.1 (2025-10-20)
 * Zweck   : Einmaleins mit Zeit je Item + robuster Finish-Schutz + Sticker
 * Neu     : _finished-Flag, Controls deaktivieren, Sticker in localStorage
 * Store   : lernspiel.stickers = { [childName]: [{ts, exerciseId, tier, tierIcon, progress:boolean}] }
 * ========================================================================== */
import { Exercises } from '../data/exercises.js';
import { Storage } from '../lib/storage.js';

const STICKERS_KEY = 'lernspiel.stickers';

function giveStickers(childName, exerciseId, reward){
  // Speichert Medaille (tierIcon) und optional Fortschritt-Sticker
  const db = Storage.get(STICKERS_KEY, {});
  if (!db[childName]) db[childName] = [];
  const ts = new Date().toISOString();

  // Medaille nur speichern, wenn es eine echte Stufe ist
  if (reward.tier !== 'none'){
    db[childName].push({
      ts, exerciseId,
      tier: reward.tier,
      tierIcon: reward.tierIcon,
      progress: false
    });
  }
  // Fortschritt (Rakete) separat
  if (reward.progressSticker){
    db[childName].push({
      ts, exerciseId,
      tier: 'progress',
      tierIcon: '🚀',
      progress: true
    });
  }
  Storage.set(STICKERS_KEY, db);
}

export const ExercisePlay = {
  _state: null,

  render({ user, exerciseId }) {
    const ex = Exercises.getById(exerciseId);
    if (!ex) {
      return `<section class="panel"><h2>Übung nicht gefunden</h2><p><a href="#/exercises">Zurück</a></p></section>`;
    }
    this._state = {
      user, ex,
      total: ex.config.questions,
      min: ex.config.min, max: ex.config.max,
      asked: 0, correct: 0, wrong: 0,
      startTs: Date.now(), timeLimit: ex.config.timeLimitSec,
      items: [],           // sammelt {a,b,result,correct,timeMs}
      qStartTs: null,      // Startzeitpunkt der aktuellen Aufgabe
      _timer: null,
      _finished: false     // ← Finish-Schutz
    };
    const q = this._nextQuestion(); // setzt auch qStartTs
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
              <strong id="q-text" style="font-size:24px;">${q.a} × ${q.b} = ?</strong>
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
      const gone = Math.floor((Date.now() - this._state.startTs) / 1000);
      const left = Math.max(0, this._state.timeLimit - gone);
      if (timeEl) timeEl.textContent = String(left);
      if (left <= 0) finish();
      else this._state._timer = requestAnimationFrame(tick);
    };
    this._state._timer = requestAnimationFrame(tick);

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
      if (this._state._finished) return;            // mehrfaches Finish verhindern
      this._state._finished = true;

      if (this._state?._timer) cancelAnimationFrame(this._state._timer);

      // Controls deaktivieren, damit nichts mehr feuert
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

      // Reward bestimmen
      const tier = stats.ratio >= 90 ? 'gold' : (stats.ratio >= 75 ? 'silver' : (stats.ratio >= 60 ? 'bronze' : 'none'));
      const tierIcon = tier === 'gold' ? '🥇' : tier === 'silver' ? '🥈' : tier === 'bronze' ? '🥉' : '🎯';
      const progressSticker = stats.delta >= 10 ? '🚀 Fortschritt' : '';
      const reward = { tier, tierIcon, progressSticker, ratio: stats.ratio, delta: stats.delta, best: stats.bestRatio, streak: stats.streak, last5Avg: stats.last5Avg };

      // Sticker speichern
      giveStickers(user.name || 'Kind', ex.id, reward);

      onFinish && onFinish({ ex, correct, wrong, stats, reward });
    };
    this._finish = finish;
  },

  // --- Helfer -------------------------------------------------------------
  _nextQuestion() {
    const a = this._rand(this._state.min, this._state.max);
    const b = this._rand(this._state.min, this._state.max);
    this._state.current = { a, b, result: a*b };
    this._state.qStartTs = Date.now(); // Startzeit für diese Aufgabe
    return this._state.current;
  },
  _rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; },

  _checkAndRecord(raw){
    const val = Number(raw);
    const ok = Number.isFinite(val) && val === this._state.current.result;
    this._record(ok);
  },

  _record(ok){
    if (this._state._finished) return; // Sicherheit
    const now = Date.now();
    const timeMs = Math.max(0, now - (this._state.qStartTs || now));
    const { a, b, result } = this._state.current;

    // Statistik aktualisieren
    this._state.asked += 1;
    if (ok) this._state.correct += 1; else this._state.wrong += 1;

    // Item speichern
    this._state.items.push({ a, b, result, correct: !!ok, timeMs });

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
    const qText = document.getElementById('q-text');
    const qNum  = document.getElementById('q-num');
    const q = this._nextQuestion();
    if (qText) qText.textContent = `${q.a} × ${q.b} = ?`;
    if (qNum)  qNum.textContent  = String(this._state.asked + 1);
  }
};
