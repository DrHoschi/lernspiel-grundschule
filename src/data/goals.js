/* ============================================================================
 * Datei   : src/data/goals.js
 * Version : v0.2.0 (2025-10-20)
 * Zweck   : Tagesziele je Kind (lokal) + Serien-Tracking für Poster ("daily3")
 * Store A : lernspiel.goals = { [child]: { [YYYY-MM-DD]: { rounds, correct, targetRounds, targetCorrect, achieved } } }
 * Store B : lernspiel.posterExtras = {
 *             [child]: {
 *               daily3?: true,
 *               _streak: { last: 'YYYY-MM-DD', run: number } // aufeinanderfolgende Tage mit erreichtem Ziel
 *             }
 *           }
 * ========================================================================== */
import { Storage } from '../lib/storage.js';

const KEY = 'lernspiel.goals';
const PE_KEY = 'lernspiel.posterExtras';
const DEFAULTS = { targetRounds: 2, targetCorrect: 50 };

// --- Utilities --------------------------------------------------------------
function todayKey(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
function loadGoals(){ return Storage.get(KEY, {}); }
function saveGoals(db){ Storage.set(KEY, db); }

function loadPoster(){
  try { return JSON.parse(localStorage.getItem(PE_KEY) || '{}'); }
  catch { return {}; }
}
function savePoster(pe){
  localStorage.setItem(PE_KEY, JSON.stringify(pe));
}

// --- API --------------------------------------------------------------------
export const Goals = {
  /**
   * Liefert/initialisiert das Tagesziel des Kindes für HEUTE.
   */
  getToday(child){
    const db = loadGoals();
    if (!db[child]) db[child] = {};
    const key = todayKey();
    if (!db[child][key]) db[child][key] = { rounds: 0, correct: 0, ...DEFAULTS, achieved: false };
    saveGoals(db);
    return { key, ...db[child][key] };
  },

  /**
   * Nach einer Runde aufrufen.
   * - zählt Runde + richtige Antworten
   * - setzt achieved-Flag, wenn Ziele erreicht
   * - aktualisiert Serien-Tracking im Poster (daily3 nach 3 Tagen in Folge)
   * @returns {object} { key, rounds, correct, targetRounds, targetCorrect, achieved, streakRun, daily3 }
   */
  onRound(child, correctCount){
    // --- Ziele fortschreiben
    const db = loadGoals();
    if (!db[child]) db[child] = {};
    const key = todayKey();
    if (!db[child][key]) db[child][key] = { rounds: 0, correct: 0, ...DEFAULTS, achieved: false };
    const rec = db[child][key];

    rec.rounds += 1;
    rec.correct += Math.max(0, Number(correctCount) || 0);
    rec.achieved = (rec.rounds >= rec.targetRounds) && (rec.correct >= rec.targetCorrect);
    saveGoals(db);

    // --- Poster/Serie fortschreiben (pro Kind!)
    // Struktur: poster[child] = { daily3?: true, _streak: { last: 'YYYY-MM-DD', run: number } }
    const poster = loadPoster();
    if (!poster[child]) poster[child] = { _streak: { last: '', run: 0 } };
    if (!poster[child]._streak) poster[child]._streak = { last: '', run: 0 };

    const st = poster[child]._streak;

    if (rec.achieved) {
      // Nur 1x pro Kalendertag erhöhen:
      if (st.last !== key) {
        st.run = (st.run || 0) + 1;
        st.last = key;
      }
      // Milestone nach 3 Tagen in Folge
      if (st.run >= 3) poster[child].daily3 = true;
    } else {
      // Ziel heute (noch) nicht erreicht → Serie nicht erhöhen
      // Bricht die Serie ab? Wir resetten konservativ nur beim Tageswechsel:
      if (st.last !== key) {
        st.run = 0;
        st.last = key;
      }
    }

    savePoster(poster);

    return {
      key,
      rounds: rec.rounds,
      correct: rec.correct,
      targetRounds: rec.targetRounds,
      targetCorrect: rec.targetCorrect,
      achieved: rec.achieved,
      streakRun: poster[child]._streak?.run || 0,
      daily3: !!poster[child].daily3
    };
  },

  /**
   * Ziele für HEUTE anpassen (nur für das aktuell eingeloggte Kind).
   */
  setTargets(child, { targetRounds, targetCorrect }){
    const db = loadGoals();
    const key = todayKey();
    if (!db[child]) db[child] = {};
    if (!db[child][key]) db[child][key] = { rounds: 0, correct: 0, ...DEFAULTS, achieved: false };

    if (targetRounds != null)  db[child][key].targetRounds  = Math.max(1, Number(targetRounds));
    if (targetCorrect != null) db[child][key].targetCorrect = Math.max(1, Number(targetCorrect));

    saveGoals(db);
    return { key, ...db[child][key] };
  }
};
