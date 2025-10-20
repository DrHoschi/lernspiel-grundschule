/* =============================================================
 * Datei  : src/auth/auth.js
 * Version: v0.4.0 (2025-10-20)
 * Zweck  : ECHTE Login-Flows
 *   - Eltern: E-Mail + Passwort
 *   - Kinder: Bild-PIN (4 Symbole) + Eltern-E-Mail + Kind-Name
 * Modi:
 *   - ONLINE (CONFIG.API_BASE gesetzt): API-Aufrufe via lib/api.js
 *   - OFFLINE (kein API_BASE): LocalStorage-Mock (Demo-Accounts)
 * Storage-Keys:
 *   - lernspiel.session   -> { role, name, email?, token? }
 *   - lernspiel.parents   -> { [email]: { passwordHashPlainDemo?: string } } (nur OFFLINE)
 *   - lernspiel.children  -> { [parentEmail]: [{ name, pin: string[4] }] }  (nur OFFLINE)
 * ============================================================= */
import { CONFIG } from '../config.js';

const KEY_SESSION  = 'lernspiel.session';
const KEY_PARENTS  = 'lernspiel.parents';
const KEY_CHILDREN = 'lernspiel.children';

function lsGet(key, fallback){ try{ const r=localStorage.getItem(key); return r?JSON.parse(r):fallback; }catch{ return fallback; } }
function lsSet(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
function lsDel(key){ localStorage.removeItem(key); }

// --- OFFLINE MOCKS ---------------------------------------------------------
function bootstrapOfflineDemo(){
  const parents = lsGet(KEY_PARENTS, {});
  const kids    = lsGet(KEY_CHILDREN, {});
  // Demo-Parent + Child anlegen, falls nicht vorhanden
  if (!parents['parent@example.com']){
    parents['parent@example.com'] = { passwordHashPlainDemo: 'Passw0rd!' };
  }
  if (!kids['parent@example.com']){
    kids['parent@example.com'] = [
      { name: 'Test', pin: ['🍎','🐶','⭐','🚗'] }
    ];
  }
  lsSet(KEY_PARENTS, parents);
  lsSet(KEY_CHILDREN, kids);
}

// Pin-Vergleich
function equalPin(a,b){ return Array.isArray(a) && Array.isArray(b) && a.length===4 && b.length===4 && a.every((x,i)=>x===b[i]); }

// --- AUTH API WRAPPER ------------------------------------------------------
export const Auth = {
  currentUser(){ return lsGet(KEY_SESSION, null); },

  async loginParent({ email, password }){
    if (CONFIG.API_BASE){
      const { API } = await import('../lib/api.js');
      const resp = await API.loginParent({ email, password });
      // Erwartet z. B.: { token, parent: { email, name? } }
      const user = { role: 'parent', name: resp.parent?.name || email, email, token: resp.token };
      lsSet(KEY_SESSION, user);
      return user;
    } else {
      // OFFLINE
      bootstrapOfflineDemo();
      const parents = lsGet(KEY_PARENTS, {});
      const rec = parents[email];
      if (!rec || (rec.passwordHashPlainDemo !== password)){
        throw new Error('Ungültige E-Mail oder Passwort (Offline-Demo: parent@example.com / Passw0rd!)');
      }
      const user = { role: 'parent', name: email, email, token: null };
      lsSet(KEY_SESSION, user);
      return user;
    }
  },

  async loginChild({ parentEmail, childName, pin }){
    if (CONFIG.API_BASE){
      const { API } = await import('../lib/api.js');
      const resp = await API.loginChild({ parentEmail, childName, pin });
      // Erwartet z. B.: { token, child: { name } }
      const user = { role: 'child', name: resp.child?.name || childName, email: parentEmail, token: resp.token };
      lsSet(KEY_SESSION, user);
      return user;
    } else {
      // OFFLINE
      bootstrapOfflineDemo();
      const kids = lsGet(KEY_CHILDREN, {});
      const list = kids[parentEmail] || [];
      const found = list.find(k => k.name.trim().toLowerCase() === childName.trim().toLowerCase());
      if (!found || !equalPin(found.pin, pin)){
        throw new Error('Kind oder PIN falsch (Offline-Demo: parent@example.com / Kind "Test" / 🍎 🐶 ⭐ 🚗)');
      }
      const user = { role: 'child', name: found.name, email: parentEmail, token: null };
      lsSet(KEY_SESSION, user);
      return user;
    }
  },

  logout(){ lsDel(KEY_SESSION); }
};
