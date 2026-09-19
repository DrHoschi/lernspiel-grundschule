const store=new Map();globalThis.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()};globalThis.location={hash:'#/exercise?id=m-addition-2to10'};
globalThis.CustomEvent=class{constructor(type,init={}){this.type=type;this.detail=init.detail}};const events=[];globalThis.window={dispatchEvent:e=>(events.push(e),true)};globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};globalThis.document={getElementById(){return null}};
const fake=()=>({disabled:false,value:'',textContent:'',addEventListener(){},focus(){}}),answer=fake(),submit=fake(),skip=fake(),time=fake();
const root={querySelector:s=>s==='#time-left'?time:s==='#answer'?answer:s==='#btn-submit'?submit:s==='#btn-skip'?skip:s==='#exercise-area'?{innerHTML:''}:null};
const {ExercisePlay}=await import('../src/ui/ExercisePlay.js');const {Achievements}=await import('../src/data/achievements.js');const {Goals}=await import('../src/data/goals.js');
Achievements.onRound=()=>({});Goals.onRound=()=>({});function assert(c,m){if(!c)throw new Error(m)}
ExercisePlay.render({user:{name:'AUD-03C Kind'},exerciseId:'m-addition-2to10'});let count=0,detail;ExercisePlay.bind(root,{onFinish:d=>{count++;detail=d}});
for(let i=0;i<10;i++){const q=ExercisePlay._state.current;ExercisePlay._checkAndRecord(i<7?String(q.result):String(q.result+1))}
assert(count===1&&events.filter(e=>e.type==='cb:exercise:finished').length===1,'completion duplication');assert(detail.correct===7&&detail.wrong===3&&detail.stats.totalAttempts===1,'payload');
ExercisePlay._finish();ExercisePlay._finish();ExercisePlay._record(true);assert(count===1&&JSON.parse(localStorage.getItem('lernspiel.progress'))['AUD-03C Kind']['m-addition-2to10'].attempts===1,'reentry');
console.log('AUD-03C PASS');