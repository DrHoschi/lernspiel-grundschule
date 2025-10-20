/* =============================================================
 * Datei  : src/ui/LoginForm.js
 * Version: v0.4.0 (2025-10-20)
 * Zweck  : Login mit zwei Modi:
 *          - Eltern: E-Mail + Passwort
 *          - Kind:   Eltern-E-Mail + Kind-Name + 4er Bild-PIN (Symbole)
 * UI:
 *   - Tabs für "Eltern" / "Kind"
 *   - Bild-PIN als kleine Symboltasten (Emoji-basierte Default-Icons)
 * ============================================================= */
import { Auth } from '../auth/auth.js';

const ICONS = ['🍎','🐶','⭐','🚗','🌈','🦊','⚽','🎵'];

export const LoginForm = {
  _state: { tab: 'child', pin: [] },

  render(){
    return `
      <section class="panel" aria-labelledby="login-title">
        <h2 id="login-title">Anmeldung</h2>
        <p>Wähle die Art der Anmeldung.</p>

        <div class="form-actions" role="tablist" aria-label="Login-Typ">
          <button id="tab-child" class="ghost" role="tab" aria-selected="true">Kind</button>
          <button id="tab-parent" class="ghost" role="tab" aria-selected="false">Eltern</button>
        </div>

        <div id="view-child">
          <div class="form-row">
            <label for="parent-email">Eltern-E-Mail</label>
            <input id="parent-email" class="input" type="email" inputmode="email" placeholder="z. B. parent@example.com" />
            <label for="child-name">Kind-Name</label>
            <input id="child-name" class="input" type="text" placeholder="z. B. Test" />
          </div>

          <div class="panel" style="margin-top:12px;">
            <h3 style="margin-bottom:8px;">Bild-PIN (4 Symbole)</h3>
            <div id="pin-slots" class="flex" style="gap:8px; margin-bottom:10px;">
              ${[0,1,2,3].map(i => `<div class="badge" data-slot="${i}" style="min-width:44px; min-height:44px; display:flex; align-items:center; justify-content:center; font-size:20px; background:rgba(255,255,255,0.08)">•</div>`).join('')}
              <button id="pin-clear" class="ghost" title="PIN leeren">Löschen</button>
            </div>
            <div id="pin-icons" class="flex" style="gap:8px; flex-wrap:wrap;">
              ${ICONS.map(ic => `<button class="pin-btn" data-ic="${ic}" title="${ic}" style="font-size:20px; min-width:44px; min-height:44px;">${ic}</button>`).join('')}
            </div>
          </div>

          <div class="form-actions" style="margin-top:12px;">
            <button id="btn-login-child">Anmelden</button>
          </div>
        </div>

        <div id="view-parent" style="display:none;">
          <div class="form-row">
            <label for="email">E-Mail</label>
            <input id="email" class="input" type="email" inputmode="email" placeholder="z. B. parent@example.com" />
            <label for="password">Passwort</label>
            <input id="password" class="input" type="password" placeholder="Dein Passwort" />
          </div>
          <div class="form-actions" style="margin-top:12px;">
            <button id="btn-login-parent">Anmelden</button>
          </div>
          <p class="muted" style="color:var(--muted);margin-top:8px;">
            Offline-Demo: <code>parent@example.com</code> / <code>Passw0rd!</code>
          </p>
        </div>
      </section>
    `;
  },

  _switch(rootEl, tab){
    this._state.tab = tab;
    rootEl.querySelector('#tab-child').setAttribute('aria-selected', String(tab==='child'));
    rootEl.querySelector('#tab-parent').setAttribute('aria-selected', String(tab==='parent'));
    rootEl.querySelector('#view-child').style.display  = tab==='child'  ? '' : 'none';
    rootEl.querySelector('#view-parent').style.display = tab==='parent' ? '' : 'none';
  },

  _renderPin(rootEl){
    const slots = rootEl.querySelectorAll('#pin-slots .badge[data-slot]');
    slots.forEach((el,i) => { el.textContent = this._state.pin[i] || '•'; });
  },

  bind(rootEl, { onSubmit }){
    // Tabs
    rootEl.querySelector('#tab-child').addEventListener('click', () => this._switch(rootEl, 'child'));
    rootEl.querySelector('#tab-parent').addEventListener('click', () => this._switch(rootEl, 'parent'));

    // PIN
    this._state.pin = [];
    this._renderPin(rootEl);
    rootEl.querySelector('#pin-clear').addEventListener('click', () => { this._state.pin = []; this._renderPin(rootEl); });
    rootEl.querySelectorAll('.pin-btn').forEach(btn=>{
      btn.addEventListener('click', () => {
        if (this._state.pin.length >= 4) return;
        this._state.pin.push(btn.getAttribute('data-ic'));
        this._renderPin(rootEl);
      });
    });

    // Eltern-Login
    rootEl.querySelector('#btn-login-parent').addEventListener('click', async () => {
      const email = rootEl.querySelector('#email').value.trim();
      const password = rootEl.querySelector('#password').value;
      try{
        const user = await Auth.loginParent({ email, password });
        onSubmit && onSubmit(user);
      }catch(e){
        alert(e.message || String(e));
      }
    });

    // Kind-Login
    rootEl.querySelector('#btn-login-child').addEventListener('click', async () => {
      const parentEmail = rootEl.querySelector('#parent-email').value.trim();
      const childName   = rootEl.querySelector('#child-name').value.trim();
      const pin         = this._state.pin.slice(0,4);
      if (pin.length !== 4){ alert('Bitte vier Symbole als PIN wählen.'); return; }
      try{
        const user = await Auth.loginChild({ parentEmail, childName, pin });
        onSubmit && onSubmit(user);
      }catch(e){
        alert(e.message || String(e));
      }
    });
  }
};
