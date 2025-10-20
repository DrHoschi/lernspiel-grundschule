/* ============================================================================
 * Datei   : src/data/exercises.js
 * Version : v0.5.0 (2025-10-20)
 * Zweck   : Übungsdefinitionen + Persistenz von Ergebnissen
 *           NEU: History je Kind & Übung, Trend/Delta, Bestwert, Streak.
 * Storage : lernspiel.progress
 * Struktur:
 *   {
 *     [childName]: {
 *       [exerciseId]: {
 *         attempts: number,
 *         correct: number,
 *         wrong: number,
 *         lastPlayedISO: string,
 *         bestRatio: number,          // bester %-Wert
 *         streak: number,             // aufeinanderfolgende Verbesserungen
 *         history: [ { ts, correct, wrong, ratio } ] // jüngste zuerst
 *       }
 *     }
 *   }
 * ========================================================================== */
import { Storage } from '../lib/storage.js';

const KEY = 'lernspiel.progress';

const _defs = [
  {
    id: 'm-multiplication-2to10',
    title: 'Einmaleins 2–10',
    config: { min: 2, max: 10, questions: 10, timeLimitSec: 120 }
  }
];

export const Exercises = {
  list() { return _defs; },
  getById(id){ return _defs.find(x => x.id === id) || null; },

  /**
   * Speichert einen Versuch und berechnet Auswertungen.
   * @param {object} p
   *  - userName
   *  - exerciseId
   *  - correctCount
   *  - wrongCount
   * @returns {object} stats { ratio, delta, bestRatio, streak, totalAttempts, last5Avg }
   */
  saveAttempt(p){
    const db = Storage.get(KEY, {});
    const u  = (p.userName || 'Kind').trim();
    const ex = p.exerciseId;
    const corr = Number(p.correctCount)||0;
    const wr   = Number(p.wrongCount)||0;
    const totalAnswered = corr + wr;
    const ratio = totalAnswered > 0 ? Math.round(100 * corr / totalAnswered) : 0;

    if (!db[u]) db[u] = {};
    if (!db[u][ex]) db[u][ex] = {
      attempts: 0, correct: 0, wrong: 0, lastPlayedISO: null,
      bestRatio: 0, streak: 0, history: []
    };

    const rec = db[u][ex];

    // Delta vs. letzter Versuch
    const lastRatio = rec.history.length ? rec.history[0].ratio : null;
    const delta = (lastRatio === null) ? 0 : (ratio - lastRatio);

    // Update Grundsummen
    rec.attempts += 1;
    rec.correct  += corr;
    rec.wrong    += wr;
    rec.lastPlayedISO = new Date().toISOString();

    // History (neueste zuerst), begrenzen auf 50 Einträge
    rec.history.unshift({ ts: rec.lastPlayedISO, correct: corr, wrong: wr, ratio });
    if (rec.history.length > 50) rec.history.length = 50;

    // Bestwert
    rec.bestRatio = Math.max(rec.bestRatio || 0, ratio);

    // Streak-Logik: nur erhöhen, wenn Verbesserung zum direkten Vorgänger
    if (lastRatio === null) {
      rec.streak = ratio > 0 ? 1 : 0;
    } else {
      if (ratio > lastRatio) rec.streak += 1;
      else if (ratio < lastRatio) rec.streak = 0; // bei Verschlechterung Reset
      // bei Gleichstand unverändert
    }

    // Durchschnitt der letzten 5
    const last5 = rec.history.slice(0, 5);
    const last5Avg = last5.length
      ? Math.round(last5.reduce((a, h) => a + h.ratio, 0) / last5.length)
      : ratio;

    Storage.set(KEY, db);

    return {
      ratio, delta, bestRatio: rec.bestRatio, streak: rec.streak,
      totalAttempts: rec.attempts, last5Avg
    };
  },

  /** Liefert aggregierte Elternsicht lokal */
  aggregateAllLocal(){
    const db = Storage.get(KEY, {});
    const childNames = Object.keys(db);

    const total = { attempts: 0, correct: 0, wrong: 0, lastPlayedISO: null };
    childNames.forEach(child => {
      Object.values(db[child]).forEach(s => {
        total.attempts += s.attempts || 0;
        total.correct  += s.correct  || 0;
        total.wrong    += s.wrong    || 0;
        if (s.lastPlayedISO && (!total.lastPlayedISO || s.lastPlayedISO > total.lastPlayedISO)) {
          total.lastPlayedISO = s.lastPlayedISO;
        }
      });
    });

    const perChild = childNames.map(child => {
      const entries = db[child];
      let cAttempts = 0, cCorrect = 0, cWrong = 0, cLast = null;
      const byEx = Object.entries(entries).map(([exId, s]) => {
        const def = this.getById(exId);
        const name = def ? def.title : exId;
        const attempts = s.history?.length || 0;
        const last = s.history?.[0]?.ratio ?? 0;
        const prev = s.history?.[1]?.ratio ?? null;
        const delta = (prev === null) ? 0 : (last - prev);
        const best = s.bestRatio || 0;
        const ratio = (s.correct + s.wrong) > 0 ? Math.round(100 * s.correct / (s.correct + s.wrong)) : 0;
        const last5Avg = s.history && s.history.length
          ? Math.round(s.history.slice(0,5).reduce((a,h)=>a+h.ratio,0)/Math.min(5,s.history.length))
          : last;

        cAttempts += s.attempts || 0;
        cCorrect  += s.correct  || 0;
        cWrong    += s.wrong    || 0;
        if (s.lastPlayedISO && (!cLast || s.lastPlayedISO > cLast)) cLast = s.lastPlayedISO;

        return { exId, name, attempts, last, prev, delta, best, ratio, last5Avg, streak: s.streak||0 };
      });
      const ratioAll = (cCorrect + cWrong) > 0 ? Math.round(100 * cCorrect / (cCorrect + cWrong)) : 0;
      return { child, attempts: cAttempts, correct: cCorrect, wrong: cWrong, ratio: ratioAll, last: cLast, byEx };
    });

    return { total, perChild };
  }
};
