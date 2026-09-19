const store=new Map();globalThis.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()};
const {Exercises}=await import('../src/data/exercises.js'); const CHILD='AUD-03B Kind',EX='m-addition-2to10';
function assert(c,m){if(!c)throw new Error(m)} function item(key,a,b,result,correct,timeMs){return{key,a,b,result,opSymbol:'+',correct,timeMs}}
function save(correct,wrong,ts,items){return Exercises.saveAttempt({userName:CHILD,exerciseId:EX,correctCount:correct,wrongCount:wrong,playedAtISO:ts,durationSec:10,items})}
const r1=save(3,2,'2026-09-05T08:00:00.000Z',[item('4+5',4,5,9,false,2000),item('2+3',2,3,5,true,1000)]);
const r2=save(4,1,'2026-09-05T08:10:00.000Z',[item('4+5',4,5,9,true,1000),item('2+3',2,3,5,true,500)]);
assert(r1.ratio===60&&r2.ratio===80&&r2.delta===20&&r2.bestRatio===80&&r2.streak===2,'round stats');
const rec=JSON.parse(localStorage.getItem('lernspiel.progress'))[CHILD][EX];
assert(rec.attempts===2&&rec.correct===7&&rec.wrong===3&&rec.history.length===2,'persistence');
assert(rec.problems['4+5'].total===2&&rec.problems['4+5'].wrong===1,'problem aggregate');
const agg=Exercises.aggregateAllLocal();assert(agg.total.attempts===2&&agg.perChild[0].child===CHILD,'aggregate');
console.log('AUD-03B PASS');