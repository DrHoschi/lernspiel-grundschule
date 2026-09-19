/* =============================================================
 * Datei  : src/ui/LoginForm.js
 * Version: v0.5.0-aud04a-i1 (2026-09-13)
 * Zweck  : Login-Surface für getrennte Parent-/Child-Authority.
 * ============================================================= */
import { Auth } from '../auth/auth.js';
const ICONS=['🍎','🐶','⭐','🚗','🌈','🦊','⚽','🎵','🦄','🍀','🐢','🚀'];

export const LoginForm={
  _state:{tab:'child',pin:[]},
  render(){
    const children=Auth.getAuthorizedChildren();
    const dev=Auth.authorityMode()==='development-local';
    return `
      <section class="panel" aria-labelledby="login-title">
        <h2 id="login-title">Anmeldung</h2>
        <div class="form-actions" role="tablist">
          <button id="tab-child" class="ghost" aria-selected="true">Kind</button>
          <button id="tab-parent" class="ghost" aria-selected="false">Eltern</button>
        </div>
        <div id="view-child">
          <label for="child-profile">Wer sitzt am Gerät?</label>
          <select id="child-profile" class="input">
            <option value="">Kinderprofil auswählen</option>
            ${children.map(c=>`<option value="${escapeHtml(c.childId)}">${escapeHtml(c.displayName)}</option>`).join('')}
          </select>
          ${children.length?'':'<p class="muted" style="color:var(--muted)">Noch kein autorisiertes Kinderprofil auf diesem Gerät. Zuerst als Elternteil anmelden und ein Profil anlegen.</p>'}
          <div class="panel" style="margin-top:12px;">
            <h3 style="margin-bottom:8px;">Bild-PIN</h3>
            <div id="pin-slots" class="flex" style="gap:8px; margin-bottom:10px;">
              ${[0,1,2,3].map(i=>`<div class="badge" data-slot="${i}" style="min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;font-size:20px;background:rgba(255,255,255,0.08)">•</div>`).join('')}
              <button id="pin-clear" class="ghost">Löschen</button>
            </div>
            <div id="pin-icons" class="flex" style="gap:8px; flex-wrap:wrap;">
              ${ICONS.map(ic=>`<button class="pin-btn" data-ic="${ic}" style="font-size:20px; min-width:44px; min-height:44px;">${ic}</button>`).join('')}
            </div>
          </div>
          <div class="form-actions" style="margin-top:12px;"><button id="btn-login-child">Anmelden</button></div>
        </div>
        <div id="view-parent" style="display:none;">
          <label for="parent-email">E-Mail</label>
          <input id="parent-email" class="input" type="email" autocomplete="username" placeholder="eltern@example.de" />
          <label for="parent-password">Passwort</label>
          <input id="parent-password" class="input" type="password" autocomplete="current-password" />
          <label for="parent-code">Eltern-PIN (4 Ziffern)</label>
          <input id="parent-code" class="input" type="tel" inputmode="numeric" placeholder="0000" maxlength="4" />
          <div class="form-actions" style="margin-top:12px;"><button id="btn-login-parent">Elternbereich öffnen</button></div>
          ${dev?'<p class="muted" style="color:var(--muted);margin-top:8px;">Development-Modus: Ein lokales Test-Elternkonto muss explizit registriert werden; Login legt kein Konto automatisch an.</p><button id="btn-dev-register" class="ghost">Test-Elternkonto registrieren</button>':''}
        </div>
      </section>`;
  },
  _switch(rootEl,tab){
    this._state.tab=tab;
    rootEl.querySelector('#tab-child').setAttribute('aria-selected',String(tab==='child'));
    rootEl.querySelector('#tab-parent').setAttribute('aria-selected',String(tab==='parent'));
    rootEl.querySelector('#view-child').style.display=tab==='child'?'':'none';
    rootEl.querySelector('#view-parent').style.display=tab==='parent'?'':'none';
  },
  _renderPin(rootEl){ rootEl.querySelectorAll('#pin-slots .badge[data-slot]').forEach((el,i)=>{el.textContent=this._state.pin[i]||'•';}); },
  bind(rootEl,{onSubmit}){
    rootEl.querySelector('#tab-child').addEventListener('click',()=>this._switch(rootEl,'child'));
    rootEl.querySelector('#tab-parent').addEventListener('click',()=>this._switch(rootEl,'parent'));
    this._state.pin=[]; this._renderPin(rootEl);
    rootEl.querySelector('#pin-clear').addEventListener('click',()=>{this._state.pin=[];this._renderPin(rootEl);});
    rootEl.querySelectorAll('.pin-btn').forEach(btn=>btn.addEventListener('click',()=>{
      if(this._state.pin.length>=4)return; this._state.pin.push(btn.getAttribute('data-ic')); this._renderPin(rootEl);
    }));
    rootEl.querySelector('#btn-login-child').addEventListener('click',async()=>{
      const childId=rootEl.querySelector('#child-profile').value; const pin=this._state.pin.slice(0,4);
      if(!childId){alert('Bitte ein vorhandenes Kinderprofil auswählen.');return;}
      if(pin.length!==4){alert('Bitte 4 Icons als PIN wählen.');return;}
      try{const user=await Auth.loginChild({childId,pin});onSubmit&&onSubmit(user);}catch(e){alert(e.message||String(e));}
    });
    rootEl.querySelector('#btn-login-parent').addEventListener('click',async()=>{
      const email=rootEl.querySelector('#parent-email').value.trim();
      const password=rootEl.querySelector('#parent-password').value;
      const code=rootEl.querySelector('#parent-code').value.trim();
      try{await Auth.loginParent({email,password});const user=Auth.unlockParentArea(code);onSubmit&&onSubmit(user);}
      catch(e){Auth.logout();alert(e.message||String(e));}
    });
    rootEl.querySelector('#btn-dev-register')?.addEventListener('click',()=>{
      const email=rootEl.querySelector('#parent-email').value.trim(); const password=rootEl.querySelector('#parent-password').value;
      try{Auth.registerDevelopmentParent({email,password});alert('Test-Elternkonto registriert. Jetzt anmelden.');}
      catch(e){alert(e.message||String(e));}
    });
  }
};
function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}