/* ============================================================================
 * Datei : src/config.js
 * Version: v0.3.0
 * Zweck  : Zentrale App-Konfiguration für API-Anbindung.
 * Hinweis: API_BASE auf deinen Server anpassen (z. B. https://api.deinspiel.de)
 *          Wenn leer/aus, läuft alles rein lokal wie bisher.
 * ========================================================================== */
export const CONFIG = {
  API_BASE: "",        // z.B. "https://lernspiel-api.example.com" (ohne Slash am Ende)
  API_TIMEOUT_MS: 8000 // Timeout für Requests
};
