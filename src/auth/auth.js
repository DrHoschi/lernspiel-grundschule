/* =============================================================
 * Datei  : src/auth/auth.js
 * Version: v0.4.2-simple (2025-10-20)
 * Zweck  : Sehr einfacher Offline-Login
 *   - Eltern: 4-stelliger Code (Default "0000")
 *   - Kind  : Name + 4-Icon-PIN
 * Storage:
 *   - lernspiel.session   -> { role:'parent'|'child', name, token:null }
 *   - lernspiel.parentPin -> "0000" (string)
 *   - lernspiel.children  -> { [childName]: { pin: [icon,icon,icon,icon] } }
 * ============================================================= */
const KEY_SESSION   = 'lernspiel.session';
const KEY_PARENTPIN = 'lernspiel.parentPin';
const KEY_CHILDREN  = 'lernspiel.children';

function lsGet(key, fallback){ try{ const t=localStorage.getItem(key); return t?JSON.parse(t):fallback; }catch{ return fallback; } }
function lsSet(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
function lsDel(key){ localStorage.removeItem(key); }
function eqPin(a,b){ return Array.isArray(a)&&Array.isArray(b) && a.length===4 && b.length===4 && a.every((x,i)=>x===b[i]); }

// Defaults beim ersten Start
(function bootstrap(){
  const p = localStorage.getItem(KEY_PARENTPIN);
  if (p === null) localStorage.setItem(KEY_PARENTPIN, JSON.stringify("0000")); // default
  const kids = lsGet(KEY_CHILDREN, null);
  if (!kids) lsSet(KEY_CHILDREN, {}); // leer anlegen
})();

export const Auth = {
  currentUser(){ return lsGet(KEY_SESSION, null); },
  logout(){ lsDel(KEY_SESSION); },

  /** Eltern-Login per 4-stelligem Code */
  async loginParent({ code }){
    const saved = lsGet(KEY_PARENTPIN, "0000");
    if (String(code||'').trim() !== String(saved)) throw new Error('Falscher Eltern-Code.');
    const user = { role:'parent', name:'Eltern', token:null };
    lsSet(KEY_SESSION, user);
    return user;
  },

  /** Eltern-Code setzen/ändern (einfach, lokal) */
  setParentCode(newCode){
    if (!/^\d{4}$/.test(String(newCode))) throw new Error('Eltern-Code muss 4 Ziffern haben.');
    lsSet(KEY_PARENTPIN, String(newCode));
  },

  /** Kind-Login per Name + 4 Icon-PIN */
  async loginChild({ childName, pin }){
    const name = (childName||'').trim();
    if (!name) throw new Error('Bitte einen Namen eingeben.');
    if (!Array.isArray(pin) || pin.length!==4) throw new Error('Bitte 4 Symbole als PIN wählen.');

    const kids = lsGet(KEY_CHILDREN, {});
    const existing = kids[name];

    if (!existing){
      // Neues Kind anlegen: erste Anmeldung legt Profil an
      kids[name] = { pin: [...pin] };
      lsSet(KEY_CHILDREN, kids);
    }else{
      // Prüfen gegen gespeicherte PIN
      if (!eqPin(existing.pin, pin)) throw new Error('PIN stimmt nicht.');
    }

    const user = { role:'child', name, token:null };
    lsSet(KEY_SESSION, user);
    return user;
  },

  /** Hilfen für UI */
  getAllChildren(){ return Object.keys(lsGet(KEY_CHILDREN, {})); },
  setChildPin(name, pin){
    const kids = lsGet(KEY_CHILDREN, {});
    if (!kids[name]) kids[name] = { pin:[...pin] };
    else kids[name].pin = [...pin];
    lsSet(KEY_CHILDREN, kids);
  },
};
