/* ============================================================================
 * Datei   : src/ui/DashboardChild.js
 * Version : v0.6.2 (2025-10-20)
 * Zweck   : Kinder-Dashboard mit Sticker-Sammlung, Zielen, Training
 * ========================================================================== */
import { Storage } from '../lib/storage.js';
import { Goals } from '../data/goals.js';
import { Achievements } from '../data/achievements.js';

const STICKERS_KEY = 'lernspiel.stickers';
function loadStickers(child){ const db = Storage.get(STICKERS_KEY, {}); return (db[child]||[]).slice().sort((a,b)=> (b.ts||'').localeCompare(a.ts||'')); }

export const DashboardChild = {
  render(user){
    const stickers = loadStickers(user.name);
    const medals = stickers.filter(s=> ['gold','silver','bronze'].includes(s.tier)).length;
    const rockets= stickers.filter(s=> s.progress).length;

    const g = Goals.getToday(user.name);
    const ach = Achievements.get(user.name);

    const progRounds  = Math.min(100, Math.round(100 * g.rounds / g.targetRounds));
    const progCorrect = Math.min(100, Math.round(100 * g.correct / g.targetCorrect));

    return `
      <section class="panel">
        <div class="spread">
          <h2>Hallo, ${user.name}!</h2>
          <div class="flex">
            <span class="badge">🥇/🥈/🥉: ${medals}</span>
            <span class="badge">🚀: ${rockets}</span>
          </div>
        </div>

        <div class="grid two" style="margin-top:8px;">
          <div class="panel">
            <h3>Tagesziele</h3>
            <p>Runden: ${g.rounds} / ${g.targetRounds}</p>
            <div style="height:8px;background:#23354f;border-radius:6px;overflow:hidden;"><div style="width:${progRounds}%;height:8px;background:#4aa3ff;"></div></div>
            <p style="margin-top:6px;">Richtige Antworten: ${g.correct} / ${g.targetCorrect}</p>
            <div style="height:8px;background:#23354f;border-radius:6px;overflow:hidden;"><div style="width:${progCorrect}%;height:8px;background:#3ecf8e;"></div></div>
            ${g.achieved ? `<p class="badge" style="margin-top:6px;">✅ Tagesziel geschafft!</p>` : ''}
            <div class="form-actions" style="margin-top:8px;">
              <button id="btn-goal-set" class="ghost">Ziele anpassen</button>
            </div>
          </div>

          <div class="panel">
            <h3>Achievements</h3>
            <p class="badge">Gold: ${ach.counts.gold}</p>
            <p class="badge">Silber: ${ach.counts.silver}</p>
            <p class="badge">Bronze: ${ach.counts.bronze}</p>
            <p class="badge">🚀: ${ach.counts.rocket}</p>
          </div>
        </div>

        <div class="panel" style="margin-top:8px;">
          <div class="spread">
            <h3>Deine Sticker</h3>
            <div class="flex">
              <button id="btn-train" class="">Trainiere schwierigste Aufgaben</button>
                  <a class="badge" href="#/kidbook">📘 Fortschrittsbuch</a>
    <a class="badge" href="#/poster">🏆 Poster</a>
    <a class="badge" href="#/train-hard?ex=m-multiplication-2to10">🎯 Schwerste Aufgaben</a>
    <a class="badge" href="#/superrun?ex=m-multiplication-2to10">⏱️ Speedrun</a>
    <button id="btn-start" class="ghost">Übungen starten</button>
    <button id="btn-clear-stickers" class="ghost">Sticker löschen</button>

            </div>
          </div>

          ${
            stickers.length
            ? `<div class="grid three" id="sticker-grid" style="margin-top:8px;">
                ${stickers.map(s=>`
                  <div class="panel" style="text-align:center;">
                    <div style="font-size:28px; line-height:1.2;">${s.tierIcon}</div>
                    <div class="badge" style="margin-top:6px;">
                      ${s.label ? s.label : (s.progress ? 'Fortschritt' : s.tier.toUpperCase())}
                    </div>
                    <div style="font-size:12px; color:var(--muted); margin-top:4px;">
                      ${new Date(s.ts).toLocaleString()}
                    </div>
                  </div>
                `).join('')}
              </div>`
            : `<p>Noch keine Sticker – starte eine Übung!</p>`
          }
        </div>
      </section>
    `;
  },

  bind(rootEl, { onStartExercises }){
    const user = (window.__APP_USER__) || null; // optional, nicht kritisch
    rootEl.querySelector('#btn-start')?.addEventListener('click', ()=> onStartExercises && onStartExercises());
    rootEl.querySelector('#btn-train')?.addEventListener('click', ()=>{
      // Standard-Übung für Training (Multiplikation); bei Bedarf später auswählbar machen
      location.hash = '#/train-hard?ex=m-multiplication-2to10';
    });

    rootEl.querySelector('#btn-clear-stickers')?.addEventListener('click', ()=>{
      if (!confirm('Möchtest du deine Sticker wirklich löschen?')) return;
      import('../lib/storage.js').then(({Storage})=>{
        import('../auth/auth.js').then(({Auth})=>{
          const u = Auth.currentUser(); if (!u) return;
          const all = Storage.get('lernspiel.stickers', {}); all[u.name] = []; Storage.set('lernspiel.stickers', all);
          // Re-render
          const main = document.getElementById('app-main');
          if (main){ main.querySelector('.layout-wrapper').innerHTML = this.render(u); this.bind(main, { onStartExercises }); }
        });
      });
    });

    rootEl.querySelector('#btn-goal-set')?.addEventListener('click', ()=>{
      import('../auth/auth.js').then(({Auth})=>{
        const u = Auth.currentUser(); if (!u) return;
        const r = prompt('Ziel: Runden pro Tag (z. B. 2):','2'); if (r==null) return;
        const c = prompt('Ziel: richtige Antworten pro Tag (z. B. 50):','50'); if (c==null) return;
        import('../data/goals.js').then(({Goals})=>{
          Goals.setTargets(u.name, { targetRounds:Number(r), targetCorrect:Number(c) });
          // Re-render:
          const main = document.getElementById('app-main');
          if (main){ main.querySelector('.layout-wrapper').innerHTML = this.render(u); this.bind(main, { onStartExercises }); }
        });
      });
    });
  }
};
