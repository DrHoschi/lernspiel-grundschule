/* ============================================================================
 * Datei   : src/data/exercises.js
 * Version : v0.8.0 (2025-11-11)
 * Zweck   : Übungsdefinitionen + Persistenz inkl. Zeit-Analytik.
 * Storage : lernspiel.progress
 *
 * Neu in v0.8.0
 * - subject/grade ergänzt (für Badge in der Übersicht)
 * - Neue Übungen: Addition, Subtraktion, Division
 * - Gemischt: add/sub/mul/div zusammen
 * - Kleine Defaults harmonisiert (10 Fragen / 120s)
 * ========================================================================== */
import { Storage } from '../lib/storage.js';
const KEY = 'lernspiel.progress';

/* ---------------------------------------------------------------------------
 * Übungs-Definitionen
 * - Jede Übung bekommt subject (Fach) & grade (Klassenstufe)
 * - config:
 *   • min/max: Wertebereich
 *   • questions: Anzahl Aufgaben
 *   • timeLimitSec: Gesamtzeit
 *   • op: 'add' | 'sub' | 'mul' | 'div'   (optional wenn ops gesetzt)
 *   • ops: Array der o.g. Operatoren für "gemischt"
 * ------------------------------------------------------------------------- */
const _defs = [
  // Einmaleins (Multiplikation)
  { id: 'm-multiplication-2to10',
    title: 'Einmaleins 2–10',
    subject: 'Mathe',
    grade: '2–3',
    config: { op: 'mul', min: 2, max: 10, questions: 10, timeLimitSec: 120 }
  },

  // Division (passend zum Einmaleins)
  { id: 'm-division-2to10',
    title: 'Division 2–10',
    subject: 'Mathe',
    grade: '2–3',
    config: { op: 'div', min: 2, max: 10, questions: 10, timeLimitSec: 120 }
  },

  // Addition
  { id: 'm-addition-2to10',
    title: 'Addition 2–10',
    subject: 'Mathe',
    grade: '1–2',
    config: { op: 'add', min: 2, max: 10, questions: 10, timeLimitSec: 120 }
  },

  // Subtraktion (ohne negative Ergebnisse)
  { id: 'm-subtraction-2to10',
    title: 'Subtraktion 2–10',
    subject: 'Mathe',
    grade: '1–2',
    config: { op: 'sub', min: 2, max: 10, questions: 10, timeLimitSec: 120 }
  },

  // Gemischt (alle vier Grundrechenarten im Bereich 2–10)
  { id: 'm-mixed-2to10',
    title: 'Gemischt 2–10',
    subject: 'Mathe',
    grade: '2–3',
    config: { ops: ['add','sub','mul','div'], min: 2, max: 10, questions: 10, timeLimitSec: 120 }
  }
];

/* ---- Helfer für Statistik ------------------------------------------------ */
function median(arr){
  if (!arr.length) return 0;
  const a = [...arr].sort((x,y)=>x-y);
  const m = Math.floor(a.length/2);
  return a.length%2 ? a[m] : Math.round((a[m-1]+a[m])/2);
}
function avg(arr){ if (!arr.length) return 0; return Math.round(arr.reduce((s,x)=>s+x,0)/arr.length); }

/* ---- Public API ---------------------------------------------------------- */
export const Exercises = {
  list(){ return _defs; },
  getById(id){ return _defs.find(x => x.id === id) || null; },

  /* Persistiert ein Ergebnis + berechnet abgeleitete Statistiken */
  saveAttempt(p){
    const db = Storage.get(KEY, {});
    const u  = (p.userName || 'Kind').trim();
    const ex = p.exerciseId;

    if (!db[u]) db[u] = {};
    if (!db[u][ex]) db[u][ex] = {
      attempts: 0, correct: 0, wrong: 0, lastPlayedISO: null,
      bestRatio: 0, streak: 0, history: [], problems: {}
    };
    const rec = db[u][ex];

    const corr = Number(p.correctCount)||0;
    const wr   = Number(p.wrongCount)||0;
    const answered = corr + wr;
    const ratio = answered > 0 ? Math.round(100 * corr / answered) : 0;

    // Historie
    const times = (p.items||[]).map(it => it.timeMs).filter(Boolean);
    const histItem = {
      ts: p.playedAtISO || new Date().toISOString(),
      ratio,
      correct: corr,
      wrong: wr,
      durationSec: Number(p.durationSec)||0,
      avgMs: avg(times),
      medianMs: median(times)
    };
    rec.history.unshift(histItem);
    if (rec.history.length > 50) rec.history.pop();

    // Probleme pro "Aufgabe" (Key)
    (p.items||[]).forEach(it => {
      const key = it.key || `${it.a}${it.opSymbol}${it.b}`;
      if (!rec.problems[key]) rec.problems[key] = {
        total: 0, wrong: 0, lastMs: 0, bestMs: 0, avgMs: 0, medianMs: 0,
        lastCorrect: null, lastTs: null, times: []
      };
      const pr = rec.problems[key];
      pr.total += 1;
      pr.lastMs = it.timeMs||0;
      pr.lastCorrect = !!it.correct;
      pr.lastTs = histItem.ts;
      pr.times.push(it.timeMs||0);
      pr.avgMs = avg(pr.times);
      pr.medianMs = median(pr.times);
      if (it.correct) pr.bestMs = pr.bestMs ? Math.min(pr.bestMs, it.timeMs||0) : (it.timeMs||0);
      if (!it.correct) pr.wrong += 1;
    });

    // Zähler + Bestwerte
    rec.attempts += 1;
    rec.correct  += corr;
    rec.wrong    += wr;
    rec.lastPlayedISO = histItem.ts;
    rec.bestRatio = Math.max(rec.bestRatio || 0, ratio);
    rec.streak = ratio === 100 ? (rec.streak + 1) : 0;

    Storage.set(KEY, db);

    // Vergleich mit letztem Mal (wenn vorhanden)
    const prev = rec.history[1]?.ratio ?? null;
    const delta = (prev == null) ? 0 : (ratio - prev);
    const last5 = rec.history.slice(0,5).map(h => h.ratio);
    const last5Avg = last5.length ? Math.round(last5.reduce((s,x)=>s+x,0)/last5.length) : 0;

    return {
      ratio, delta, bestRatio: rec.bestRatio, streak: rec.streak,
      totalAttempts: rec.attempts, last5Avg,
      durationSec: histItem.durationSec, avgMs: histItem.avgMs, medianMs: histItem.medianMs
    };
  },

  /* Aggregierte Stats (für Parent/Charts) – unverändert gelassen */
  getSummary(){
    const db = Storage.get(KEY, {});
    const total = Object.keys(db).length;
    const perChild = Object.entries(db).map(([child, map]) => {
      let cAttempts=0, cCorrect=0, cWrong=0, cLast=null;
      const byEx = Object.entries(map).map(([exId, s]) => {
        const attempts = s.attempts||0;
        const last = s.lastPlayedISO||null;
        const prev = s.history?.[1]?.ratio ?? null;
        const delta = (prev==null) ? 0 : (s.history?.[0]?.ratio ?? 0) - prev;
        const best = s.bestRatio || 0;
        const ratioAll = (s.correct+s.wrong)>0 ? Math.round(100*s.correct/(s.correct+s.wrong)) : 0;
        const last5Avg = (() => {
          const a = (s.history||[]).slice(0,5).map(h=>h.ratio);
          return a.length? Math.round(a.reduce((x,y)=>x+y,0)/a.length) : 0;
        })();
        const durAvg5 = (() => {
          const a = (s.history||[]).slice(0,5).map(h=>h.durationSec||0);
          return a.length? Math.round(a.reduce((x,y)=>x+y,0)/a.length) : 0;
        })();

        cAttempts += attempts; cCorrect += s.correct||0; cWrong += s.wrong||0;
        if (s.lastPlayedISO && (!cLast || s.lastPlayedISO > cLast)) cLast = s.lastPlayedISO;

        return { exId, name: exId, attempts, last, prev, delta, best, ratio: ratioAll, last5Avg, durAvg5 };
      });
      const ratioTotal = (cCorrect+cWrong)>0 ? Math.round(100*cCorrect/(cCorrect+cWrong)) : 0;
      return { child, attempts:cAttempts, correct:cCorrect, wrong:cWrong, ratio:ratioTotal, last:cLast, byEx };
    });

    return { total, perChild };
  },

  /** Für StatsDetail: Daten-Rohzugriff */
  getRaw(){ return Storage.get(KEY, {}); }
};
