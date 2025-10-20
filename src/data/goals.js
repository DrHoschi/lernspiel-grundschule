/* ============================================================================
 * Datei   : src/data/goals.js
 * Version : v0.1.0
 * Zweck   : Tagesziele je Kind (lokal)
 * Store   : lernspiel.goals = { [child]: { [YYYY-MM-DD]: { rounds, correct, targetRounds, targetCorrect, achieved } } }
 * ========================================================================== */
import { Storage } from '../lib/storage.js';

const KEY = 'lernspiel.goals';
const DEFAULTS = { targetRounds:2, targetCorrect:50 };

function todayKey(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd= String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}
function load(){ return Storage.get(KEY, {}); }
function save(db){ Storage.set(KEY, db); }

export const Goals = {
  getToday(child){
    const db = load();
    if (!db[child]) db[child] = {};
    const key = todayKey();
    if (!db[child][key]) db[child][key] = { rounds:0, correct:0, ...DEFAULTS, achieved:false };
    save(db);
    return { key, ...db[child][key] };
  },

  onRound(child, correctCount){
    const db = load();
    if (!db[child]) db[child] = {};
    const key = todayKey();
    if (!db[child][key]) db[child][key] = { rounds:0, correct:0, ...DEFAULTS, achieved:false };
    const rec = db[child][key];
    rec.rounds += 1;
    rec.correct += Math.max(0, Number(correctCount)||0);
    rec.achieved = (rec.rounds >= rec.targetRounds) && (rec.correct >= rec.targetCorrect);
    save(db);
    return { key, ...rec };
  },

  setTargets(child, { targetRounds, targetCorrect }){
    const db = load();
    const key = todayKey();
    if (!db[child]) db[child] = {};
    if (!db[child][key]) db[child][key] = { rounds:0, correct:0, ...DEFAULTS, achieved:false };
    if (targetRounds)  db[child][key].targetRounds  = Math.max(1, Number(targetRounds));
    if (targetCorrect) db[child][key].targetCorrect = Math.max(1, Number(targetCorrect));
    save(db);
    return { key, ...db[child][key] };
  }
};
