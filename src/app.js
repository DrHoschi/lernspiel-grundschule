/* =============================================================
 * Datei : src/app.js
 * Version: v0.2.2 (2025-10-20)
 * ============================================================= */
import { Router } from './router.js';
import { Navbar } from './ui/Navbar.js';
import { Auth } from './auth/auth.js';
import { LoginForm } from './ui/LoginForm.js';
import { DashboardParent } from './ui/DashboardParent.js';
import { DashboardChild } from './ui/DashboardChild.js';
import { ExercisesList } from './ui/ExercisesList.js';
import { NotFound } from './ui/NotFound.js';
import { ExercisePlay } from './ui/ExercisePlay.js';
import { StatsDetail } from './ui/StatsDetail.js';
import { TrainHard } from './ui/TrainHard.js';
import { ProgressBook } from './ui/ProgressBook.js';
import { MilestonePoster } from './ui/MilestonePoster.js';
import { SuperRun } from './ui/SuperRun.js';

const AppState={version:'0.1.0-pre',user:null};
const validChild=u=>!!(u&&u.role==='child'&&u.childId&&u.parentId);
const validParent=u=>!!(u&&u.role==='parent'&&u.parentId&&Auth.isParentAreaUnlocked());

export const App={
  init(opts={}){AppState.version=opts.version||AppState.version;this.mountNavbar();this.configureRoutes();Router.start();console.log('[app] bereit',AppState.version);},
  mountNavbar(){
    const el=document.getElementById('app-navbar'); if(!el)return;
    el.innerHTML=Navbar.render(AppState);
    Navbar.bind(el,{onLogout:()=>{Auth.logout();AppState.user=null;Router.go('/login');this.refreshNavbar();}});
  },
  refreshNavbar(){this.mountNavbar();},
  configureRoutes(){
    Router.define('/',()=>{const u=Auth.currentUser();if(!u)return Router.go('/login');AppState.user=u;return Router.go(u.role==='parent'?'/parent':'/child');});
    Router.define('/login',()=>{
      const main=document.getElementById('app-main');
      main.innerHTML=`<div class="layout-wrapper">${LoginForm.render()}</div>`;
      LoginForm.bind(main,{onSubmit:user=>{AppState.user=user;this.refreshNavbar();Router.go(user.role==='parent'?'/parent':'/child');}});
    });
    Router.define('/parent',()=>{
      const u=Auth.currentUser(),main=document.getElementById('app-main');if(!validParent(u))return Router.go('/login');
      AppState.user=u;main.innerHTML=`<div class="layout-wrapper">${DashboardParent.render(u)}</div>`;DashboardParent.bind(main,u);
    });
    Router.define('/child',()=>{
      const u=Auth.currentUser(),main=document.getElementById('app-main');if(!validChild(u))return Router.go('/login');
      AppState.user=u;main.innerHTML=`<div class="layout-wrapper">${DashboardChild.render(u)}</div>`;DashboardChild.bind(main,{onStartExercises:()=>Router.go('/exercises')});
    });
    Router.define('/exercises',()=>{
      const u=Auth.currentUser(),main=document.getElementById('app-main');if(!validChild(u))return Router.go('/login');
      AppState.user=u;main.innerHTML=`<div class="layout-wrapper">${ExercisesList.render(u)}</div>`;ExercisesList.bind(main);
    });
    Router.define('/train-hard',({query})=>{
      const u=Auth.currentUser(),main=document.getElementById('app-main');if(!validChild(u))return Router.go('/login');
      const ex=query.get('ex')||'m-multiplication-2to10';
      main.innerHTML=`<div class="layout-wrapper">${TrainHard.render({user:u,exId:ex})}</div>`;
      TrainHard.bind(main,{onFinish:({ex,correct,wrong,stats})=>{main.innerHTML=`<div class="layout-wrapper"><section class="panel"><h2>Fertig: ${ex.title}</h2><p>✅ <strong>${correct}</strong> · ❌ <strong>${wrong}</strong></p><p>Quote: <strong>${stats.ratio}%</strong></p><p><a href="#/child">Zurück zum Dashboard</a></p></section></div>`;}});
    });
    Router.define('/stats',()=>{
      const u=Auth.currentUser(),main=document.getElementById('app-main');if(!validParent(u))return Router.go('/login');
      AppState.user=u;main.innerHTML=`<div class="layout-wrapper">${StatsDetail.render()}</div>`;StatsDetail.bind(main);
    });
    Router.define('/kidbook',()=>{
      const u=Auth.currentUser(),main=document.getElementById('app-main');if(!validChild(u))return Router.go('/login');
      main.innerHTML=`<div class="layout-wrapper">${ProgressBook.render({user:u})}</div>`;ProgressBook.bind(main);
    });
    Router.define('/poster',()=>{
      const u=Auth.currentUser(),main=document.getElementById('app-main');if(!validChild(u))return Router.go('/login');
      main.innerHTML=`<div class="layout-wrapper">${MilestonePoster.render({user:u})}</div>`;MilestonePoster.bind(main);
    });
    Router.define('/superrun',({query})=>{
      const u=Auth.currentUser(),main=document.getElementById('app-main');if(!validChild(u))return Router.go('/login');
      const ex=query.get('ex')||'m-multiplication-2to10';
      main.innerHTML=`<div class="layout-wrapper">${SuperRun.render({user:u,exId:ex})}</div>`;
      SuperRun.bind(main,{onFinish:({correct,total,best,isNewBest})=>{main.innerHTML=`<div class="layout-wrapper"><section class="panel"><h2>Speedrun fertig</h2><p>Richtige in 60s: <strong>${correct}</strong> / ${total}</p><p>Dein Rekord: <strong>${best}</strong>${isNewBest?' 🎉 (neu!)':''}</p><p><a href="#/child">Zurück zum Dashboard</a></p></section></div>`;}});
    });
    Router.define('/exercise',({query})=>{
      const u=Auth.currentUser(),main=document.getElementById('app-main');if(!validChild(u))return Router.go('/login');
      AppState.user=u;const id=query.get('id')||'m-multiplication-2to10';
      main.innerHTML=`<div class="layout-wrapper">${ExercisePlay.render({user:u,exerciseId:id})}</div>`;
      ExercisePlay.bind(main,{onFinish:({ex,correct,wrong,stats,reward})=>{
        const deltaHtml=stats.delta===0?'':stats.delta>0?` (<span style="color:var(--good);font-weight:700">+${stats.delta}%</span> vs. letztes Mal)`:` (<span style="color:var(--bad);font-weight:700">-${Math.abs(stats.delta)}%</span> vs. letztes Mal)`;
        const tierLabel=reward.tier==='gold'?'GOLD':reward.tier==='silver'?'SILBER':reward.tier==='bronze'?'BRONZE':'Weitermachen!';
        main.innerHTML=`<div class="layout-wrapper"><section class="panel"><h2>Fertig: ${ex.title}</h2><p>✅ Richtig: <strong>${correct}</strong> · ❌ Falsch: <strong>${wrong}</strong></p><div class="grid two"><div class="panel"><h3>Dein Ergebnis</h3><p>Quote: <strong>${stats.ratio}%</strong>${deltaHtml}</p><p>Ø letzte 5: <strong>${stats.last5Avg}%</strong></p><p>Bestwert: <strong>${stats.bestRatio}%</strong> · Streak: <strong>${stats.streak}x</strong></p></div><div class="panel"><h3>Belohnung</h3><p style="font-size:24px; margin:0;">${reward.tierIcon} ${tierLabel}</p>${reward.progressSticker?`<p class="badge" style="margin-top:8px;">${reward.progressSticker}</p>`:''}</div></div><p style="margin-top:12px;"><a href="#/exercises">Weitere Übungen</a></p></section></div>`;
      }});
    });
    Router.fallback(()=>{const main=document.getElementById('app-main');main.innerHTML=`<div class="layout-wrapper">${NotFound.render()}</div>`;});
  }
};