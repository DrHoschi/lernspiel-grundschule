/* =============================================================
 * Datei  : src/auth/auth.js
 * Version: v0.5.0-aud04a-i1 (2026-09-13)
 * Zweck  : Parent/Child Identity + Session Authority Core
 *
 * AUD-04A-I1:
 * - stabile parentId/childId in Sessions
 * - kein Child-Auto-Create beim Login
 * - Parent-Account-Login getrennt von Eltern-PIN-Guard
 * - lokale Profile sind Device-Cache, keine Ownership-Autorität
 * - API ist autoritativ sobald CONFIG.API_BASE gesetzt ist
 * - expliziter lokaler Development-Authority-Store nur bei deaktivierter API
 *
 * Noch NICHT in I1:
 * - Umstellung von Progress/Rewards/Goals auf childId (AUD-04A-I2)
 * - Name->childId Datenmigration
 * ============================================================= */
import { API } from '../lib/api.js';
import { CONFIG } from '../config.js';

const KEY_SESSION='lernspiel.session';
const KEY_PARENTPIN='lernspiel.parentPin';
const KEY_DEVICE='lernspiel.identity.device';
const KEY_DEV_AUTH='lernspiel.identity.devAuthority';

function lsGet(key,fallback){ try{ const t=localStorage.getItem(key); return t?JSON.parse(t):fallback; }catch{ return fallback; } }
function lsSet(key,val){ localStorage.setItem(key,JSON.stringify(val)); }
function lsDel(key){ localStorage.removeItem(key); }
function eqPin(a,b){ return Array.isArray(a)&&Array.isArray(b)&&a.length===4&&b.length===4&&a.every((x,i)=>x===b[i]); }
function normalizeEmail(v){ return String(v||'').trim().toLowerCase(); }
function id(prefix){
  const random=globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}:${random}`;
}
function publicChild(child){
  return { childId:child.childId,parentId:child.parentId,displayName:child.displayName,name:child.displayName,
    active:child.active!==false,offlineLogin:!!child.offlineLogin };
}
function saveDeviceContext(parentId,children=[]){
  const prev=lsGet(KEY_DEVICE,{});
  const normalized=children.filter(Boolean).map(c=>({
    childId:String(c.childId||''),parentId:String(c.parentId||parentId||''),
    displayName:String(c.displayName||c.name||'').trim(),active:c.active!==false,offlineLogin:!!c.offlineLogin
  })).filter(c=>c.childId&&c.parentId&&c.displayName);
  lsSet(KEY_DEVICE,{parentId:String(parentId||prev.parentId||''),children:normalized,updatedAt:new Date().toISOString()});
}
function normalizeParentSession(raw){
  const parentId=String(raw?.parentId||raw?.parent?.parentId||raw?.parent?.id||raw?.id||'').trim();
  if(!parentId) throw new Error('Parent-Login lieferte keine stabile parentId.');
  return {role:'parent',parentId,name:String(raw?.displayName||raw?.parent?.displayName||raw?.name||'Eltern'),
    token:raw?.token||raw?.accessToken||null,parentAreaUnlocked:false};
}
function normalizeChildSession(raw,expectedParentId,fallbackChild){
  const childId=String(raw?.childId||raw?.child?.childId||raw?.child?.id||fallbackChild?.childId||'').trim();
  const parentId=String(raw?.parentId||raw?.child?.parentId||expectedParentId||fallbackChild?.parentId||'').trim();
  const name=String(raw?.displayName||raw?.child?.displayName||raw?.name||fallbackChild?.displayName||'').trim();
  if(!childId||!parentId) throw new Error('Kind-Login lieferte keine stabile childId/parentId.');
  if(expectedParentId&&parentId!==expectedParentId) throw new Error('Kind gehört nicht zum autorisierten Elternkontext.');
  return {role:'child',childId,parentId,name:name||'Kind',token:raw?.token||raw?.accessToken||null};
}
function loadDevAuthority(){
  const db=lsGet(KEY_DEV_AUTH,null);
  if(db&&Array.isArray(db.parents)&&Array.isArray(db.children)) return db;
  const fresh={parents:[],children:[]}; lsSet(KEY_DEV_AUTH,fresh); return fresh;
}
function saveDevAuthority(db){ lsSet(KEY_DEV_AUTH,db); }
function requireDevMode(){ if(CONFIG.API_BASE) throw new Error('Lokale Development-Authority ist bei aktivierter API gesperrt.'); }

(function bootstrap(){
  if(localStorage.getItem(KEY_PARENTPIN)===null) lsSet(KEY_PARENTPIN,'0000');
  if(!CONFIG.API_BASE) loadDevAuthority();
})();

export const Auth={
  authorityMode(){ return CONFIG.API_BASE?'backend':'development-local'; },
  currentUser(){
    const u=lsGet(KEY_SESSION,null);
    if(!u||!['parent','child'].includes(u.role)) return null;
    if(u.role==='parent'&&!u.parentId) return null;
    if(u.role==='child'&&(!u.childId||!u.parentId)) return null;
    return u;
  },
  logout(){ lsDel(KEY_SESSION); },

  async loginParent({email,password}){
    const normalizedEmail=normalizeEmail(email);
    if(!normalizedEmail) throw new Error('Bitte E-Mail eingeben.');
    if(!String(password||'')) throw new Error('Bitte Passwort eingeben.');
    let raw;
    if(CONFIG.API_BASE){
      raw=await API.loginParent({email:normalizedEmail,password});
      const session=normalizeParentSession(raw);
      let children=Array.isArray(raw?.children)?raw.children:[];
      try{ if(!children.length) children=await API.listChildren({token:session.token}); }catch{}
      saveDeviceContext(session.parentId,Array.isArray(children)?children:[]);
      lsSet(KEY_SESSION,session); return session;
    }
    const db=loadDevAuthority();
    const parent=db.parents.find(p=>p.email===normalizedEmail&&p.active!==false);
    if(!parent||parent.password!==String(password)) throw new Error('E-Mail oder Passwort stimmt nicht.');
    const children=db.children.filter(c=>c.parentId===parent.parentId&&c.active!==false).map(publicChild);
    saveDeviceContext(parent.parentId,children);
    const session=normalizeParentSession({parentId:parent.parentId,displayName:parent.displayName||'Eltern',token:null});
    lsSet(KEY_SESSION,session); return session;
  },

  unlockParentArea(code){
    const u=this.currentUser();
    if(!u||u.role!=='parent') throw new Error('Parent-Session erforderlich.');
    const saved=String(lsGet(KEY_PARENTPIN,'0000'));
    if(String(code||'').trim()!==saved) throw new Error('Falscher Eltern-Code.');
    const unlocked={...u,parentAreaUnlocked:true}; lsSet(KEY_SESSION,unlocked); return unlocked;
  },
  lockParentArea(){ const u=this.currentUser(); if(u&&u.role==='parent') lsSet(KEY_SESSION,{...u,parentAreaUnlocked:false}); },
  isParentAreaUnlocked(){ const u=this.currentUser(); return !!(u&&u.role==='parent'&&u.parentAreaUnlocked===true); },
  setParentCode(newCode){
    const u=this.currentUser();
    if(!u||u.role!=='parent'||!u.parentAreaUnlocked) throw new Error('Freigeschalteter Elternbereich erforderlich.');
    if(!/^\d{4}$/.test(String(newCode))) throw new Error('Eltern-Code muss 4 Ziffern haben.');
    lsSet(KEY_PARENTPIN,String(newCode));
  },

  async loginChild({childId,pin}){
    const device=lsGet(KEY_DEVICE,{});
    const parentId=String(device.parentId||'').trim();
    const children=Array.isArray(device.children)?device.children:[];
    const child=children.find(c=>c.childId===childId&&c.parentId===parentId&&c.active!==false);
    if(!parentId) throw new Error('Kein autorisierter Elternkontext auf diesem Gerät.');
    if(!child) throw new Error('Unbekanntes oder nicht autorisiertes Kinderprofil.');
    if(!Array.isArray(pin)||pin.length!==4) throw new Error('Bitte 4 Symbole als PIN wählen.');
    let session;
    if(CONFIG.API_BASE){
      const raw=await API.loginChild({parentId,childId,pin});
      session=normalizeChildSession(raw,parentId,child);
    }else{
      const db=loadDevAuthority();
      const authChild=db.children.find(c=>c.childId===childId&&c.parentId===parentId&&c.active!==false);
      if(!authChild) throw new Error('Kinderprofil ist nicht mehr autorisiert.');
      if(!eqPin(authChild.pin,pin)) throw new Error('PIN stimmt nicht.');
      session=normalizeChildSession(authChild,parentId,authChild);
    }
    lsSet(KEY_SESSION,session); return session;
  },

  getAuthorizedChildren(){
    const device=lsGet(KEY_DEVICE,{});
    return Array.isArray(device.children)?device.children.map(c=>({...c,name:c.displayName})):[];
  },
  getAllChildren(){ return this.getAuthorizedChildren().map(c=>c.displayName); },

  async createChild({displayName,pin}){
    const u=this.currentUser();
    if(!u||u.role!=='parent') throw new Error('Parent-Session erforderlich.');
    const name=String(displayName||'').trim();
    if(!name) throw new Error('Bitte einen Namen eingeben.');
    if(!Array.isArray(pin)||pin.length!==4) throw new Error('Bitte 4 Symbole als PIN wählen.');
    let created;
    if(CONFIG.API_BASE){
      created=await API.createChild({displayName:name,pin},{token:u.token});
      created=publicChild({...created,parentId:created?.parentId||u.parentId,displayName:created?.displayName||name});
    }else{
      const db=loadDevAuthority();
      const child={childId:id('child'),parentId:u.parentId,displayName:name,pin:[...pin],active:true,offlineLogin:true};
      db.children.push(child); saveDevAuthority(db); created=publicChild(child);
    }
    const current=this.getAuthorizedChildren().filter(c=>c.childId!==created.childId);
    saveDeviceContext(u.parentId,[...current,created]); return created;
  },

  registerDevelopmentParent({email,password,displayName='Eltern'}){
    requireDevMode();
    const normalizedEmail=normalizeEmail(email);
    if(!normalizedEmail) throw new Error('Bitte E-Mail eingeben.');
    if(String(password||'').length<4) throw new Error('Passwort muss mindestens 4 Zeichen haben.');
    const db=loadDevAuthority();
    if(db.parents.some(p=>p.email===normalizedEmail)) throw new Error('Elternkonto existiert bereits.');
    const parent={parentId:id('parent'),email:normalizedEmail,password:String(password),displayName:String(displayName||'Eltern'),active:true};
    db.parents.push(parent); saveDevAuthority(db);
    return {parentId:parent.parentId,email:parent.email,displayName:parent.displayName};
  }
};