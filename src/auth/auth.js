/* =============================================================
 * auth/auth.js — v0.1.0
 * Sehr einfache Mock-Auth:
 *   - Speichert Nutzer { role: 'parent'|'child', name } in LocalStorage
 *   - Kein Passwortzwang für PoC (kann später ergänzt werden)
 * ============================================================= */
import { Storage } from '../lib/storage.js';

const KEY = 'lernspiel.user';

export const Auth = {
  currentUser() {
    return Storage.get(KEY, null);
  },
  login({ role, name }) {
    const user = { role, name: name || (role === 'parent' ? 'Elternteil' : 'Kind') };
    Storage.set(KEY, user);
    console.log('[auth] login', user);
    return user;
  },
  logout() {
    Storage.remove(KEY);
    console.log('[auth] logout');
  }
};
