/* ============================================================================
 * Datei   : src/ui/SuperRun.js
 * Version : v1.0.0
 * Zweck   : 60s Speedrun – zähle richtige Antworten + Rekord speichern
 * Stores  : lernspiel.superrun = { [child]: { [exId]: { best:number } } }
 *           lernspiel.posterExtras -> { speed10:true, speed15:true, speed20:true }
 * ========================================================================== */
import { Exercises } from '../data/exercises.js';

function getRec(child, ex){ const db = JSON.parse(localStorage.getItem('lernspiel.superrun')||'{}'); return db?.[child]?.[ex]?.best || 0; }
function setRec(child, ex, score){
  const db = JSON.parse(localStorage.getItem('lernspiel.superrun')||'{}');
  if (!db[child]) db[child]={};
  if (!db[child][ex]) db[child][ex]={ best:0 };
  if (score > (db[child][ex].best||0)) db[child][ex].best = score;
  localStorage.setItem('lernspiel.superrun', JSON.stringify(db));

  // Poster-Extras freischalten
  const pe = JSON.parse(localStorage.getItem('lernspiel.posterExtras')||'{}');
  if (score >= 10) pe.speed10 = true;
  if (score >= 15) pe.speed15 = true;
  if (score >= 20) pe.speed20 = true;
  localStorage.setItem('lernspiel.posterExtras', JSON.stringify(pe));
}

export const SuperRun = {
  _st:null,

  render({ user, exId }){
    const ex = Exercises.getById(exId) || Exercises.getById('m-multiplication-2to10');
    this._st = {
      user, ex, left: 60, correct:0, total:0,
      min: ex.config.min, max: ex.config.max,
      current: null, timer:null
    };
    const q = this._next();
    return `
      <section class="panel">
        <div class="spread">
          <h2>Speedrun (60s) – ${ex.title}</h2>
          <div class="badge">Rest: <span id="t-left">60</span>s</div>
        </div>

        <div class="panel">
          <div class="flex" style="align-items:center; gap:8px;">
            <strong id="q-text" style="font-size:26px;">${q.a} × ${q.b} = ?</strong>
            <span class="badge">✅ <span id="ok">0</span></span>
            <span class="badge">∑ <span id="sum">0</span></span>
          </div>
          <label for="ans">Antwort</label>
          <input id="ans" class="input" type="number" inputmode="numeric" placeholder="Zahl" />
          <div class="form-actions">
            <button id="btn-go">Prüfen</button>
          </div>
        </div>

        <p style="margin-top:10px;">
          <a class="badge" href="#/child">← Zurück</a>
        </p>
      </section>
    `;
  },

  bind(rootEl, { onFinish }){
    const leftEl = rootEl.querySelector('#t-left');
    const okEl   = rootEl.querySelector('#ok');
    const sumEl  = rootEl.querySelector('#sum');
    const ansEl  = rootEl.querySelector('#ans');
    const goBtn  = rootEl.querySelector('#btn-go');

    const tick = ()=>{
      this._st.left -= 1;
      if (leftEl) leftEl.textContent = String(this._st.left);
      if (this._st.left <= 0){ finish(); }
      else this._st.timer = setTimeout(tick, 1000);
    };
    this._st.timer = setTimeout(tick, 1000);

    const check = ()=>{
      const v = Number(ansEl.value);
      const ok = Number.isFinite(v) && v === this._st.current.result;
      if (ok) this._st.correct += 1;
      this._st.total += 1;
      if (okEl) okEl.textContent = String(this._st.correct);
      if (sumEl) sumEl.textContent = String(this._st.total);
      ansEl.value = '';
      const q = this._next();
      document.getElementById('q-text').textContent = `${q.a} × ${q.b} = ?`;
      ansEl.focus();
    };

    goBtn.addEventListener('click', check);
    ansEl.addEventListener('keydown', e=>{ if (e.key==='Enter') check(); });

    const finish = ()=>{
      if (this._st.timer) clearTimeout(this._st.timer);
      const bestOld = getRec(this._st.user.name, this._st.ex.id);
      const isNew   = this._st.correct > bestOld;
      if (isNew) setRec(this._st.user.name, this._st.ex.id, this._st.correct);
      onFinish && onFinish({ ex:this._st.ex, correct:this._st.correct, total:this._st.total, best: Math.max(this._st.correct,bestOld), isNewBest:isNew });
    };
  },

  _next(){
    const a = this._rand(this._st.min, this._st.max);
    const b = this._rand(this._st.min, this._st.max);
    this._st.current = { a, b, result: a*b };
    return this._st.current;
  },
  _rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
};
