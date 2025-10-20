/* =============================================================
 * ui/ExercisePlay.js — v0.3.0
 * Einmaleins-Trainer (2–10) mit Timer, Punkten, Fehlern.
 * Neu: Attempt wird lokal gespeichert UND (falls API_BASE gesetzt)
 *      zusätzlich an das Backend gesendet (Fallback bei Fehler).
 * ============================================================= */
import { Exercises } from '../data/exercises.js';
import { Utils } from '../lib/utils.js';

export const ExercisePlay = {
  // State nur zur Laufzeit
  _state: null,

  render({ user, exerciseId }) {
    const ex = Exercises.getById(exerciseId);
    if (!ex) {
      return `
        <section class="panel">
          <h2>Übung nicht gefunden</h2>
          <p>Die ausgewählte Übung existiert nicht.</p>
          <p><a href="#/exercises">Zurück zur Liste</a></p>
        </section>
      `;
    }
    // Initial-Setup
    this._state = {
      ex,
      total: ex.config.questions,
      min: ex.config.min,
      max: ex.config.max,
      asked: 0,
      correct: 0,
      wrong: 0,
      startTs: Date.now(),
      timeLimit: ex.config.timeLimitSec,
      user
    };
    // Erste Aufgabe vorbereiten
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
              <strong id="q-text" style="font-size:24px;">${q.a} × ${q.b} = ?</strong>
              <span class="badge">Aufgabe <span id="q-num">1</span> / ${ex.config.questions}</span>
            </div>
            <label for="answer">Antwort</label>
            <input id="answer" class="input" type="number" inputmode="numeric" placeholder="Zahl eingeben" />
            <div class="form-actions">
              <button id="btn-submit">Prüfen</button>
              <button id="btn-skip" class="ghost" title="Aufgabe überspringen (zählt als falsch)">Überspringen</button>
            </div>
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
    const timeEl = rootEl.querySelector('#time-left');
    const answerEl = rootEl.querySelector('#answer');
    const submitBtn = rootEl.querySelector('#btn-submit');
    const skipBtn = rootEl.querySelector('#btn-skip');

    // Timer
    const tick = () => {
      const gone = Math.floor((Date.now() - this._state.startTs) / 1000);
      const left = Math.max(0, this._state.timeLimit - gone);
      if (timeEl) timeEl.textContent = String(left);
      if (left <= 0) {
        finish();
      } else {
        this._state._timer = requestAnimationFrame(tick);
      }
    };
    this._state._timer = requestAnimationFrame(tick);

    // Interaktionen
    submitBtn.addEventListener('click', () => {
      this._check(answerEl.value);
      answerEl.value = '';
      answerEl.focus();
    });
    answerEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this._check(answerEl.value);
        answerEl.value = '';
      }
    });
    skipBtn.addEventListener('click', () => {
      this._mark(false);
    });

    // === NEU: finish sendet zusätzlich an API (mit Fallback) ===
    const finish = async () => {
      if (this._state?._timer) cancelAnimationFrame(this._state._timer);
      const { user, ex, correct, wrong, startTs } = this._state;

      // 1) Lokal speichern (wie bisher)
      const stats = Exercises.saveAttempt({
        userName: user.name || 'Kind',
        exerciseId: ex.id,
        correctCount: correct,
        wrongCount: wrong
      });

      // 2) Optional: Server-Sync versuchen
      try {
        const durationSec = Math.max(0, Math.floor((Date.now() - startTs) / 1000));
        const payload = {
          childName: user.name || 'Kind',
          exerciseId: ex.id,
          correct,
          wrong,
          durationSec,
          playedAtISO: new Date().toISOString()
        };
        const { API } = await import('../lib/api.js');
        await API.postAttempt(payload, { token: null });
      } catch (e) {
        console.warn('[attempt] Server-Sync fehlgeschlagen (lokal gespeichert):', e?.message || e);
      }

      onFinish && onFinish({ ex, correct, wrong, stats });
    };
    this._finish = finish;
  },

  _nextQuestion() {
    const a = this._rand(this._state.min, this._state.max);
    const b = this._rand(this._state.min, this._state.max);
    this._state.current = { a, b, result: a * b };
    return this._state.current;
  },

  _rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },

  _check(raw) {
    const val = Number(raw);
    const ok = Number.isFinite(val) && val === this._state.current.result;
    this._mark(ok);
  },

  _mark(ok) {
    const qText = document.getElementById('q-text');
    const qNum = document.getElementById('q-num');
    const sC = document.getElementById('stat-correct');
    const sW = document.getElementById('stat-wrong');

    this._state.asked += 1;
    if (ok) this._state.correct += 1;
    else this._state.wrong += 1;

    if (sC) sC.textContent = String(this._state.correct);
    if (sW) sW.textContent = String(this._state.wrong);

    if (this._state.asked >= this._state.total) {
      this._finish && this._finish();
      return;
    }
    const q = this._nextQuestion();
    if (qText) qText.textContent = `${q.a} × ${q.b} = ?`;
    if (qNum) qNum.textContent = String(this._state.asked + 1);
  }
};
