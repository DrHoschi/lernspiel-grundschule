/* ============================================================================
 * Datei  : src/config.js
 * Version: v0.4.0 (2025-10-20)
 * Zweck  : Zentrale Konfiguration für API/Timeouts.
 * Hinweise:
 *   - Wenn API_BASE leer ist, laufen alle Auth/Stats-Aufrufe lokal (Mock).
 *   - Sobald API_BASE gesetzt ist, wird zuerst die API genutzt (mit Fallback).
 * ========================================================================== */
export const CONFIG = {
  API_BASE: "",          // z. B. "https://api.lernspiel.example.com"
  API_TIMEOUT_MS: 8000
};
