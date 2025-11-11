/* ============================================================================
 * Datei   : src/data/exercises.js
 * Version : v0.8.2 (2025-11-11)
 * Zweck   : Übungsdefinitionen + Persistenz inkl. Zeit-Analytik
 * Storage : lernspiel.progress
 *
 * Änderung ggü. deinem Stand:
 * - Titel OHNE Emojis (Darstellung in der Liste mit blauem Styling)
 * ========================================================================== */
import { Storage } from '../lib/storage.js';
const KEY = 'lernspiel.progress';

/* ----------------------------------------------------------------------------
 * Übungs-Definitionen (unverändert bis auf Titel-Emojis entfernt)
 * -------------------------------------------------------------------------- */
const _defs = [
  { id: 'm-multiplication-2to10',
    title: 'Einmaleins 2–10',
    subject: 'Mathe', grade: '2–3',
    config: { op: 'mul', min: 2, max: 10, questions: 10, timeLimitSec: 120 }
  },
  { id: 'm-addition-2to10',
    title: 'Addition 2–10',
    subject: 'Mathe', grade: '1–2',
    config: { op: 'add', min: 2, max: 10, questions: 10, timeLimitSec: 120 }
  },
  { id: 'm-subtraction-2to10',
    title: 'Subtraktion 2–10',
    subject: 'Mathe', grade: '1–2',
    config: { op: 'sub', min: 2, max: 10, questions: 10, timeLimitSec: 120 }
  },
  { id: 'm-division-2to10',
    title: 'Division 2–10',
    subject: 'Mathe', grade: '2–3',
    config: { op: 'div', min: 2, max: 10, questions: 10, timeLimitSec: 120 }
  },
  { id: 'm-mixed-2to10',
    title: 'Gemischt 2–10',
    subject: 'Mathe', grade: '2–3',
    config: { ops: ['add','sub','mul','div'], min: 2, max: 10, questions: 10, timeLimitSec: 120 }
  }
];

function median(arr){ if (!arr.length) return 0; const a=[...arr].sort((x,y)=>x-y); const m=Math.floor(a.length/2); return a.length%2?a[m]:Math.round((a[m-1]+a[m])/2); }
function avg(arr){ if (!arr.length) return 0; return Math.round(arr.reduce((s,x)=>s+x,0)/arr.length); }

export const Exercises = {
  list(){ return _defs; },
  getById(id){ return _defs.find(x => x.id === id) || null; },

  // dein SaveAttempt + Aggregate unverändert beibehalten:
  saveAttempt(p){
    const db = Storage.get(KEY, {}); const u=(p.userName||'Kind').trim(); const ex=p.exerciseId;
    if (!db[u]) db[u]={}; if (!db[u][ex]) db[u][ex]={attempts:0,correct:0,wrong:0,lastPlayedISO:null,bestRatio:0,streak:0,history:[],problems:{}};
    const rec = db[u][ex];

    const corr=+p.correctCount||0, wr=+p.wrongCount||0, answered=corr+wr, ratio=answered?Math.round(100*corr/answered):0;
    const durationSec = Math.max(0, +p.durationSec||0);
    const itemTimes = Array.isArray(p.items)?p.items.map(it=>Math.max(0,+it.timeMs||0)):[];
    const avgMs=avg(itemTimes), medianMs=median(itemTimes);

    const lastRatio = rec.history.length ? rec.history[0].ratio : null;
    const delta = (lastRatio===null)?0:(ratio-lastRatio);

    rec.attempts+=1; rec.correct+=corr; rec.wrong+=wr;
    rec.lastPlayedISO = p.playedAtISO || new Date().toISOString();

    rec.history.unshift({ ts:rec.lastPlayedISO, ratio, correct:corr, wrong:wr, durationSec, avgMs, medianMs });
    if (rec.history.length>100) rec.history.length=100;

    rec.bestRatio = Math.max(rec.bestRatio||0, ratio);
    if (lastRatio===null) rec.streak = ratio>0?1:0;
    else if (ratio>lastRatio) rec.streak+=1;
    else if (ratio<lastRatio) rec.streak=0;

    if (Array.isArray(p.items)){
      p.items.forEach(it=>{
        const key = it.key || `${it.a}x${it.b}`;
        if (!rec.problems[key]) rec.problems[key]={total:0,wrong:0,lastMs:null,bestMs:null,avgMs:0,medianMs:0,lastCorrect:null,lastTs:null,times:[]};
        const pr = rec.problems[key];
        pr.total+=1; if(!it.correct) pr.wrong+=1;
        pr.lastMs=Math.max(0,+it.timeMs||0); pr.lastCorrect=!!it.correct; pr.lastTs=rec.lastPlayedISO;
        pr.times.unshift(pr.lastMs); if(pr.times.length>50) pr.times.length=50;
        pr.bestMs=(pr.bestMs==null)?pr.lastMs:Math.min(pr.bestMs,pr.lastMs);
        pr.avgMs=avg(pr.times); pr.medianMs=median(pr.times);
      });
    }

    const last5 = rec.history.slice(0,5);
    const last5Avg = last5.length?Math.round(last5.reduce((a,h)=>a+h.ratio,0)/last5.length):ratio;

    Storage.set(KEY, db);

    const probs = Object.entries(rec.problems).map(([k,pr])=>{
      const errRate = pr.total ? Math.round(100*pr.wrong/pr.total) : 0;
      return { key:k, errRate, total:pr.total, wrong:pr.wrong, lastMs:pr.lastMs, bestMs:pr.bestMs, avgMs:pr.avgMs, medianMs:pr.medianMs };
    }).sort((a,b)=> b.errRate!==a.errRate ? b.errRate-a.errRate : (b.avgMs||0)-(a.avgMs||0)).slice(0,10);

    return { ratio, delta, bestRatio: rec.bestRatio, streak: rec.streak,
      totalAttempts: rec.attempts, last5Avg, durationSec, avgMs, medianMs, problemTop: probs };
  },

  aggregateAllLocal(){
    const db = Storage.get(KEY, {}); const childNames=Object.keys(db);
    const total={attempts:0,correct:0,wrong:0,lastPlayedISO:null};
    childNames.forEach(child=>{ Object.values(db[child]).forEach(s=>{ total.attempts+=s.attempts||0; total.correct+=s.correct||0; total.wrong+=s.wrong||0; if(s.lastPlayedISO && (!total.lastPlayedISO || s.lastPlayedISO>total.lastPlayedISO)) total.lastPlayedISO=s.lastPlayedISO; }); });
    const perChild = childNames.map(child=>{
      const entries=db[child]; let cAttempts=0,cCorrect=0,cWrong=0,cLast=null;
      const byEx = Object.entries(entries).map(([exId,s])=>{
        const def=this.getById(exId); const name=def?def.title:exId; const attempts=s.history?.length||0;
        const last=s.history?.[0]?.ratio??0; const prev=s.history?.[1]?.ratio??null; const delta=(prev===null)?0:(last-prev);
        const best=s.bestRatio||0; const ratioAll=(s.correct+s.wrong)>0?Math.round(100*s.correct/(s.correct+s.wrong)):0;
        const last5Avg=attempts?Math.round(s.history.slice(0,5).reduce((a,h)=>a+h.ratio,0)/Math.min(5,attempts)):last;
        const durAvg5=attempts?Math.round(s.history.slice(0,5).reduce((a,h)=>a+(h.avgMs||0),0)/Math.min(5,attempts)):0;
        cAttempts+=s.attempts||0; cCorrect+=s.correct||0; cWrong+=s.wrong||0; if(s.lastPlayedISO && (!cLast || s.lastPlayedISO>cLast)) cLast=s.lastPlayedISO;
        return { exId, name, attempts, last, prev, delta, best, ratio:ratioAll, last5Avg, durAvg5 };
      });
      const ratioTotal=(cCorrect+cWrong)>0?Math.round(100*cCorrect/(cCorrect+cWrong)):0;
      return { child, attempts:cAttempts, correct:cCorrect, wrong:cWrong, ratio:ratioTotal, last:cLast, byEx };
    });

    return { total, perChild };
  },

  getRaw(){ return Storage.get(KEY, {}); }
};
