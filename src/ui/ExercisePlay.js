/* ============================================================================
 * Datei   : src/ui/ExercisePlay.js
 * Version : v0.8.3 (2025-11-11)
 * Zweck   : Aufgaben-Spieler (add/sub/mul/div + gemischt) mit robustem Reward
 * Änderungen:
 * - Reward-Pipeline robust:
 *     • nutzt Achievements.evaluate(exId, stats) wenn vorhanden,
 *     • sonst Achievements.onRound(child, reward, exId),
 *     • sonst lokale Tier-Berechnung.
 * - Events: cb:stickers:updated + cb:rewards:earned
 * - Fallback-UI zeigt Medaille/Icon deutlich an.
 * - Liest weiterhin &range=… aus der Hash-URL und überschreibt max.
 * ========================================================================== */
import { Exercises } from '../data/exercises.js';
import { Storage } from '../lib/storage.js';
import { Achievements } from '../data/achievements.js';
import { Goals } from '../data/goals.js';

const STICKERS_KEY = 'lernspiel.stickers';

/* ----------------------------- Operatoren -------------------------------- */
const OP = {
  add:{ sym:'＋', make(min,max){ const a=r(min,max), b=r(min,max); return { a,b, result:a+b, text:`${a} + ${b} = ?`, opSymbol:'+', key:`${a}+${b}` }; }},
  sub:{ sym:'−', make(min,max){ let a=r(min,max), b=r(min,max); if(b>a)[a,b]=[b,a]; return { a,b, result:a-b, text:`${a} - ${b} = ?`, opSymbol:'-', key:`${a}-${b}` }; }},
  mul:{ sym:'×', make(min,max){ const a=r(min,max), b=r(min,max); return { a,b, result:a*b, text:`${a} × ${b} = ?`, opSymbol:'×', key:`${a}×${b}` }; }},
  div:{ sym:'÷', make(min,max){ const a=r(min,max), b=r(min,max), c=a*b; return { a:c, b:a, result:b, text:`${c} ÷ ${a} = ?`, opSymbol:'÷', key:`${c}÷${a}` }; }}
};
function r(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

/* ------------------------------- Utils ----------------------------------- */
function readHashQuery(){
  const raw = (location.hash.split('?')[1] || '').split('&').filter(Boolean);
  const q = {}; raw.forEach(p => { const [k,v] = p.split('='); if (k) q[decodeURIComponent(k)] = decodeURIComponent(v||''); });
  return q;
}
function computeTier(stats){
  const t = stats?.ratio ?? 0;
  const tier = t>=90?'gold':(t>=75?'silver':(t>=60?'bronze':'none'));
  const tierIcon = tier==='gold'?'🥇':tier==='silver'?'🥈':tier==='bronze'?'🥉':'🎯';
  const progressSticker = (stats?.delta ?? 0) >= 10 ? '🚀 Fortschritt' : '';
  return { tier, tierIcon, progressSticker, ratio: t, delta: stats?.delta||0, best: stats?.bestRatio||0, streak: stats?.streak||0, last5Avg: stats?.last5Avg||0 };
}
function giveStickers(childName, exerciseId, reward){
  const db = Storage.get(STICKERS_KEY, {});
  if (!db[childName]) db[childName] = [];
  db[childName].push({ ts: new Date().toISOString(), exerciseId, tier: reward.tier, tierIcon: reward.tierIcon, progress: !!reward.progressSticker });
  Storage.set(STICKERS_KEY, db);
  // Events für eventgetriebene UIs
  window.dispatchEvent(new CustomEvent('cb:stickers:updated', { detail:{ childName, exerciseId, reward }}));
  window.dispatchEvent(new CustomEvent('cb:rewards:earned',  { detail:{ childName, exerciseId, reward }}));
}

export const ExercisePlay = {
  _state: null,

  render({ user, exerciseId }) {
    const ex = Exercises.getById(exerciseId);
    if (!ex) return `<section class="panel"><h2>Übung nicht gefunden</h2><p><a href="#/exercises">Zurück</a></p></section>`;

    const ops = Array.isArray(ex.config.ops) && ex.config.ops.length ? ex.config.ops : [ex.config.op || 'mul'];

    // Zahlenraum aus Hash (&range=…) übernehmen (nur max überschreiben)
    const q = readHashQuery();
    const forcedMax = Number(q.range);
    const min = ex.config.min;
    const max = Number.isFinite(forcedMax) && forcedMax >= min ? forcedMax : ex.config.max;

    this._state = {
      user, ex, ops, min, max,
      total: ex.config.questions,
      asked: 0, correct: 0, wrong: 0,
      startTs: Date.now(), timeLimit: ex.config.timeLimitSec,
      items: [], qStartTs: null, _timer: null, _finished: false
    };

    const first = this._nextQuestion();
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
              <strong id="q-text" style="font-size:24px;">${first.text}</strong>
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

    const disableControls = () => { answerEl&&(answerEl.disabled=true); submitBtn&&(submitBtn.disabled=true); skipBtn&&(skipBtn.disabled=true); };

    const tick = () => {
      const gone = Math.floor((Date.now() - this._state.startTs)/1000);
      const left = Math.max(0, this._state.timeLimit - gone);
      if (timeEl) timeEl.textContent = String(left);
      if (left <= 0) finish(); else this._state._timer = requestAnimationFrame(tick);
    };
    this._state._timer = requestAnimationFrame(tick);

    submitBtn?.addEventListener('click', ()=>{ this._checkAndRecord(answerEl.value); answerEl.value=''; answerEl.focus(); });
    answerEl?.addEventListener('keydown',(e)=>{ if(e.key==='Enter'){ this._checkAndRecord(answerEl.value); answerEl.value=''; }});
    skipBtn?.addEventListener('click', ()=> this._record(false));

    const finish = () => {
      if (this._state._finished) return;
      this._state._finished = true;
      if (this._state._timer) cancelAnimationFrame(this._state._timer);
      disableControls();

      const { user, ex, correct, wrong, startTs, items } = this._state;

      const stats = Exercises.saveAttempt({
        userName: user?.name || 'Kind',
        exerciseId: ex.id,
        correctCount: correct,
        wrongCount: wrong,
        playedAtISO: new Date().toISOString(),
        durationSec: Math.max(0, Math.round((Date.now()-startTs)/1000)),
        items
      });

      // === Reward ermitteln (robust für beide API-Varianten) ===============
      let reward = null;

      // 1) Alte API: Achievements.evaluate(exId, stats) → reward
      if (Achievements && typeof Achievements.evaluate === 'function') {
        try { reward = Achievements.evaluate(ex.id, stats) || null; } catch(e){ /* ignore */ }
      }

      // 2) Falls nix geliefert: lokale Tier-Berechnung
      if (!reward) reward = computeTier(stats);

      // 3) Neue API: Achievements.onRound(child, reward, exId) – optional
      try { Achievements?.onRound?.(user?.name || 'Kind', reward, ex.id); } catch(e){ /* ignore */ }

      // 4) Goals (optional, kompatibel)
      try { Goals?.onRound?.(user?.name || 'Kind', correct); } catch(e){ /* ignore */ }

      // 5) Sticker persistieren + Events feuern
      giveStickers(user?.name || 'Kind', ex.id, reward);

      const detail = { ex, correct, wrong, stats, reward };
      window.dispatchEvent(new CustomEvent('cb:exercise:finished', { detail }));

      // Eigener Callback der App?
      if (typeof onFinish === 'function'){ onFinish(detail); return; }

      // Fallback-UI mit Medaille
      const area = rootEl.querySelector('#exercise-area');
      if (area){
        const ratio = (correct+wrong)>0 ? Math.round(100*correct/(correct+wrong)) : 0;
        area.innerHTML = `
          <div class="panel" style="grid-column:1/-1">
            <h3>Ergebnis</h3>
            <p style="font-size:22px;margin:.25em 0;">${reward.tierIcon || '🎯'} <strong>${reward.tier?.toUpperCase?.() || 'ERGEBNIS'}</strong></p>
            <p><strong>${ex.title}</strong></p>
            <p>✅ Richtig: <strong>${correct}</strong> · ❌ Falsch: <strong>${wrong}</strong></p>
            <p>Trefferquote: <strong>${ratio}%</strong> · Bester Wert: <strong>${stats.bestRatio}%</strong></p>
            <div class="form-actions">
              <a class="button" href="#/exercises">Weitere Übungen</a>
              <a class="button ghost" href="#/rewards">Belohnungen</a>
            </div>
            <p class="muted">Tipp: Deine Rewards-Ansicht kann auf <code>cb:rewards:earned</code> reagieren.</p>
          </div>`;
      }
    };
    this._finish = finish;
  },

  // ------------------------------- Helfer ---------------------------------
  _nextQuestion(){ const type=this._pickOp(); const q=OP[type].make(this._state.min,this._state.max); this._state.current=q; this._state.qStartTs=Date.now(); return q; },
  _pickOp(){ const ops=this._state.ops || ['mul']; return ops[Math.floor(Math.random()*ops.length)]; },
  _checkAndRecord(raw){ const val=Number(raw); const ok=Number.isFinite(val)&&val===this._state.current.result; this._record(ok); },
  _record(ok){
    if (this._state._finished) return;
    const now=Date.now(); const timeMs=Math.max(0, now-(this._state.qStartTs||now));
    const { a,b,result,key,opSymbol } = this._state.current;

    this._state.asked += 1;
    if (ok) this._state.correct += 1; else this._state.wrong += 1;

    this._state.items.push({ a,b,result,correct:!!ok,timeMs,key,opSymbol });

    const sC=document.getElementById('stat-correct'); const sW=document.getElementById('stat-wrong');
    if (sC) sC.textContent=String(this._state.correct);
    if (sW) sW.textContent=String(this._state.wrong);

    if (this._state.asked >= this._state.total){ this._finish && this._finish(); return; }

    const qText=document.getElementById('q-text'); const qNum=document.getElementById('q-num');
    const q=this._nextQuestion(); if (qText) qText.textContent=q.text; if (qNum) qNum.textContent=String(this._state.asked+1);
  }
};
