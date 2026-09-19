/* ============================================================================
 * Datei  : src/lib/api.js
 * Version: v0.5.0-aud04a-i1 (2026-09-13)
 * Zweck  : Dünner Fetch-Client + Identity/Ownership Authority Transport.
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
    method, headers,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    credentials: 'omit', cache: 'no-store'
  }), CONFIG.API_TIMEOUT_MS);

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${res.statusText} – ${txt}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

export const API = {
  loginParent({ email, password }) {
    return request('/auth/login', { method:'POST', body:{ email, password } });
  },
  loginChild({ parentId, childId, pin }) {
    return request('/auth/child-login', { method:'POST', body:{ parentId, childId, pin } });
  },
  listChildren({ token } = {}) { return request('/children', { method:'GET', token }); },
  createChild({ displayName, pin }, { token } = {}) {
    return request('/children', { method:'POST', body:{ displayName, pin }, token });
  },
  updateChild(childId, payload, { token } = {}) {
    return request(`/children/${encodeURIComponent(childId)}`, { method:'PATCH', body:payload, token });
  },
  deleteChild(childId, { token } = {}) {
    return request(`/children/${encodeURIComponent(childId)}`, { method:'DELETE', token });
  },
  getStats({ token } = {}) { return request('/stats', { method:'GET', token }); },
  postAttempt(payload, { token } = {}) { return request('/attempt', { method:'POST', body:payload, token }); }
};