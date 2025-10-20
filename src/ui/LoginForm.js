/* =============================================================
 * Datei  : src/ui/LoginForm.js
 * Version: v0.4.2-simple (2025-10-20)
 * ============================================================= */
import { Auth } from '../auth/auth.js';

const ICONS = ['🍎','🐶','⭐','🚗','🌈','🦊','⚽','🎵','🦄','🍀','🐢','🚀'];

export const LoginForm = {
  _state: { tab:'child', pin:[] },

  render(){
    return `
      <section class="panel" aria-labelledby="login-title">
        <h2 id="login-title">Anmeldung</h2>
        <div class="form-actions" role="tablist">
          <button id="tab-child" class="ghost" aria-selected="true">Kind</button>
          <button id="tab-parent" class="ghost" aria-selected="false">Eltern</button>
        </div>

        <!-- KIND -->
        <div id="view-child">
          <label for="child-name">Dein Name</label>
          <input id="child-name" class="input" type="text" placeholder="z. B. Mia" />

          <div class="panel" style="margin-top:12px;">
            <h3 style="margin-bottom:8px;">Deine 4 Lieblings-Icons (PIN)</h3>
            <div id="pin-slots" class="flex" style="gap:8px; margin-bottom:10px;">
              ${[0,1,2,3].map(i=>`<div class="badge" data-slot="${i}" style="min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;font-size:20px;background:rgba(255,255,255,0.08)">•</div>`).join('')}
              <button id="pin-clear" class="ghost">Löschen</button>
            </div>
            <div id="pin-icons" class="flex" style="gap:8px; flex-wrap:wrap;">
              ${ICONS.map(ic=>`<button class="pin-btn" data-ic="${ic}" style="font-size:20px; min-width:44px; min-height:44px;">${ic}</button>`).join('')}
            </div>
          </div>

          <div class="form-actions" style="margin-top:12px;">
            <button id="btn-login-child">Anmelden</button>
          </div>
        </div>

        <!-- ELTERN -->
        <div id="view-parent" style="display:none;">
          <label for="parent-code">Eltern-Code (4 Ziffern)</label>
          <input id="parent-code" class="input" type="tel" inputmode="numeric" placeholder="z. B. 0000" maxlength="4" />

          <div class="form-actions" style="margin-top:12px;">
            <button id="btn-login-parent">Anmelden</button>
            <button id="btn-change-code" class="ghost">Code ändern</button>
          </div>
          <p class="muted" style="color:var(--muted); margin-top:8px;">Standard: 0000</p>
        </div>
      </section>
    `;
  },

  _switch(rootEl, tab){
    this._state.tab = tab;
    rootEl.querySelector('#tab-child').setAttribute('aria-selected', String(tab==='child'));
    rootEl.querySelector('#tab-parent').setAttribute('aria-selected', String(tab==='parent'));
    rootEl.querySelector('#view-child').style.display = tab==='child' ? '' : 'none';
    rootEl.querySelector('#view-parent').style.display= tab==='parent'? '' : 'none';
  },

  _renderPin(rootEl){
    const slots = rootEl.querySelectorAll('#pin-slots .badge[data-slot]');
    slots.forEach((el,i)=>{ el.textContent = this._state.pin[i] || '•'; });
  },

  bind(rootEl, { onSubmit }){
    // Tabs
    rootEl.querySelector('#tab-child').addEventListener('click', ()=>this._switch(rootEl,'child'));
    rootEl.querySelector('#tab-parent').addEventListener('click', ()=>this._switch(rootEl,'parent'));

    // PIN handling
    this._state.pin = []; this._renderPin(rootEl);
    rootEl.querySelector('#pin-clear').addEventListener('click', ()=>{ this._state.pin=[]; this._renderPin(rootEl); });
    rootEl.querySelectorAll('.pin-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if (this._state.pin.length>=4) return;
        this._state.pin.push(btn.getAttribute('data-ic'));
        this._renderPin(rootEl);
      });
    });

    // Kind-Login
    rootEl.querySelector('#btn-login-child').addEventListener('click', async ()=>{
      const childName = rootEl.querySelector('#child-name').value.trim();
      const pin = this._state.pin.slice(0,4);
      if (pin.length!==4){ alert('Bitte 4 Icons als PIN wählen.'); return; }
      try{
        const user = await Auth.loginChild({ childName, pin });
        onSubmit && onSubmit(user);
      }catch(e){ alert(e.message||String(e)); }
    });

    // Eltern-Login
    rootEl.querySelector('#btn-login-parent').addEventListener('click', async ()=>{
      const code = rootEl.querySelector('#parent-code').value.trim();
      try{
        const user = await Auth.loginParent({ code });
        onSubmit && onSubmit(user);
      }catch(e){ alert(e.message||String(e)); }
    });

    // Eltern-Code ändern
    rootEl.querySelector('#btn-change-code').addEventListener('click', ()=>{
      const n = prompt('Neuen Eltern-Code (4 Ziffern) eingeben:','');
      if (n==null) return;
      try{ Auth.setParentCode(n); alert('Eltern-Code gespeichert.'); }
      catch(e){ alert(e.message||String(e)); }
    });
  }
};
