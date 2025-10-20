/* ============================================================================
 * Datei : src/lib/api.js
 * Version: v0.3.0
 * Zweck  : Dünner Fetch-Client mit Timeout + Fallback-Fehlern.
 * ========================================================================== */
import { CONFIG } from '../config.js';

function withTimeout(promise, ms){
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    promise.then(v => { clearTimeout(t); resolve(v); },
                 e => { clearTimeout(t); reject(e); });
  });
}

async function request(path, { method='GET', body, token } = {}){
  if (!CONFIG.API_BASE) throw new Error('API disabled');
  const headers = { 'Accept': 'application/json' };
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await withTimeout(fetch(`${CONFIG.API_BASE}${path}`, {
    method,
    headers,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    credentials: 'omit',
    cache: 'no-store'
  }), CONFIG.API_TIMEOUT_MS);

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${res.statusText} – ${txt}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

export const API = {
  // POST /attempt  { childName, exerciseId, correct, wrong, durationSec, playedAtISO }
  async postAttempt(payload, { token } = {}) {
    return request('/attempt', { method: 'POST', body: payload, token });
  },

  // GET /stats     -> aggregierte Elternsicht
  async getStats({ token } = {}) {
    return request('/stats', { method: 'GET', token });
  }
};
