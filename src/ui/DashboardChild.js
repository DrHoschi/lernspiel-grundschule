/* ============================================================================
 * Datei   : src/ui/DashboardChild.js
 * Version : v0.6.1 (2025-10-20)
 * Zweck   : Kinder-Dashboard mit Sticker-Sammlung (lokal)
 * Store   : lernspiel.stickers = { [childName]: [{ts, exerciseId, tier, tierIcon, progress}] }
 * ========================================================================== */
import { Storage } from '../lib/storage.js';

const STICKERS_KEY = 'lernspiel.stickers';

function loadStickers(childName){
  const db = Storage.get(STICKERS_KEY, {});
  return (db[childName] || []).slice().sort((a,b)=> (b.ts||'').localeCompare(a.ts||''));
}

export const DashboardChild = {
  render(user){
    const stickers = loadStickers(user.name);
    const countMedals = stickers.filter(s=> s.tier==='gold' || s.tier==='silver' || s.tier==='bronze').length;
    const countRocket = stickers.filter(s=> s.progress).length;

    return `
      <section class="panel">
        <div class="spread">
          <h2>Hallo, ${user.name}!</h2>
          <div class="flex">
            <span class="badge">🥇/🥈/🥉: ${countMedals}</span>
            <span class="badge">🚀: ${countRocket}</span>
          </div>
        </div>

        <div class="panel" style="margin-top:8px;">
          <h3>Deine Sticker</h3>
          ${
            stickers.length
            ? `<div class="grid three" id="sticker-grid" style="margin-top:8px;">
                ${stickers.map(s=>`
                  <div class="panel" style="text-align:center;">
                    <div style="font-size:28px; line-height:1.2;">${s.tierIcon}</div>
                    <div class="badge" style="margin-top:6px;">
                      ${s.progress ? 'Fortschritt' : (s.tier.toUpperCase())}
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

        <div class="form-actions" style="margin-top:12px;">
          <button id="btn-start">Übungen starten</button>
          <button id="btn-clear-stickers" class="ghost" title="Nur deine Sticker löschen">Sticker löschen</button>
        </div>
      </section>
    `;
  },

  bind(rootEl, { onStartExercises }){
    const startBtn = rootEl.querySelector('#btn-start');
    startBtn?.addEventListener('click', ()=> onStartExercises && onStartExercises());

    // Sticker nur für dieses Kind löschen
    rootEl.querySelector('#btn-clear-stickers')?.addEventListener('click', ()=>{
      if (!confirm('Möchtest du deine Sticker wirklich löschen?')) return;
      import('../lib/storage.js').then(({Storage})=>{
        const db = Storage.get('lernspiel.stickers', {});
        const u = rootEl.closest('#app-main')?.dataset?.userName; // not used; safer to just ask parent
        // Wir brauchen den Namen aus Navbar/AppState – einfacher:
        // Hole aktuellen User aus Session:
        import('../auth/auth.js').then(({Auth})=>{
          const user = Auth.currentUser();
          if (!user) return;
          const all = Storage.get('lernspiel.stickers', {});
          all[user.name] = [];
          Storage.set('lernspiel.stickers', all);
          // UI neu zeichnen:
          const main = document.getElementById('app-main');
          if (main) {
            // Re-render
            main.querySelector('.layout-wrapper').innerHTML = this.render(user);
            this.bind(main, { onStartExercises });
          }
        });
      });
    });
  }
};
