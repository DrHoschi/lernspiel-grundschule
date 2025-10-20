/* =============================================================
 * Datei : src/app.js
 * Version: v0.2.2 (2025-10-20)
 * Änderung: /parent ruft DashboardParent.bind(main, u)
 * ============================================================= */
import { Router } from './router.js';
import { Navbar } from './ui/Navbar.js';
import { Storage } from './lib/storage.js';
import { Auth } from './auth/auth.js';
import { LoginForm } from './ui/LoginForm.js';
import { DashboardParent } from './ui/DashboardParent.js';
import { DashboardChild } from './ui/DashboardChild.js';
import { ExercisesList } from './ui/ExercisesList.js';
import { NotFound } from './ui/NotFound.js';
import { ExercisePlay } from './ui/ExercisePlay.js';
import { Exercises } from './data/exercises.js';
import { StatsDetail } from './ui/StatsDetail.js';

const AppState = { version: 'v0.2.2', user: null };

export const App = {
  init(opts = {}) {
    AppState.version = opts.version || AppState.version;
    this.mountNavbar();
    this.configureRoutes();
    Router.start();
    console.log('[app] bereit', AppState.version);
  },

  mountNavbar() {
    const el = document.getElementById('app-navbar');
    if (!el) return;
    el.innerHTML = Navbar.render(AppState);
    Navbar.bind(el, {
      onLogout: () => {
        Auth.logout();
        AppState.user = null;
        Router.go('/login');
        this.refreshNavbar();
      }
    });
  },

  refreshNavbar() { this.mountNavbar(); },

  configureRoutes() {
    Router.define('/', () => {
      const u = Auth.currentUser();
      if (!u) return Router.go('/login');
      AppState.user = u;
      if (u.role === 'parent') return Router.go('/parent');
      return Router.go('/child');
    });


Router.define('/login', () => {
  const main = document.getElementById('app-main');
  main.innerHTML = `<div class="layout-wrapper">${LoginForm.render()}</div>`;
  LoginForm.bind(main, {
    onSubmit: (user) => {
      // user kommt bereits aus Auth (parent/child)
      AppState.user = user;
      this.refreshNavbar();
      if (user.role === 'parent') Router.go('/parent');
      else Router.go('/child');
    }
  });
});

    // ⬇️ Hier ist die relevante Änderung:
    Router.define('/parent', () => {
      const u = Auth.currentUser();
      const main = document.getElementById('app-main');
      if (!u || u.role !== 'parent') return Router.go('/login');
      AppState.user = u;
      main.innerHTML = `<div class="layout-wrapper">${DashboardParent.render(u)}</div>`;
      DashboardParent.bind(main, u); // vorher: DashboardParent.bind(main)
    });

    Router.define('/child', () => {
      const u = Auth.currentUser();
      const main = document.getElementById('app-main');
      if (!u || u.role !== 'child') return Router.go('/login');
      AppState.user = u;
      main.innerHTML = `<div class="layout-wrapper">${DashboardChild.render(u)}</div>`;
      DashboardChild.bind(main, { onStartExercises: () => Router.go('/exercises') });
    });

    Router.define('/exercises', () => {
      const u = Auth.currentUser();
      const main = document.getElementById('app-main');
      if (!u || u.role !== 'child') return Router.go('/login');
      AppState.user = u;
      main.innerHTML = `<div class="layout-wrapper">${ExercisesList.render(u)}</div>`;
      ExercisesList.bind(main);
    });

Router.define('/stats', () => {
  const u = Auth.currentUser();
  const main = document.getElementById('app-main');
  if (!u || u.role !== 'parent') return Router.go('/login');
  AppState.user = u;
  main.innerHTML = `<div class="layout-wrapper">${StatsDetail.render()}</div>`;
  StatsDetail.bind(main);
});
    
    // Übung spielen – mit Belohnungs-Screen (stats + reward)
Router.define('/exercise', ({ query }) => {
  const u = Auth.currentUser();
  const main = document.getElementById('app-main');
  if (!u || u.role !== 'child') return Router.go('/login');
  AppState.user = u;

  const id = query.get('id') || 'm-multiplication-2to10';
  main.innerHTML = `<div class="layout-wrapper">${ExercisePlay.render({ user: u, exerciseId: id })}</div>`;

  ExercisePlay.bind(main, {
    onFinish: ({ ex, correct, wrong, stats, reward }) => {
      // Hilfsfunktionen für die Anzeige
      const deltaHtml = (stats.delta === 0)
        ? ''
        : (stats.delta > 0
            ? ` (<span style="color:var(--good);font-weight:700">+${stats.delta}%</span> vs. letztes Mal)`
            : ` (<span style="color:var(--bad);font-weight:700">-${Math.abs(stats.delta)}%</span> vs. letztes Mal)`);

      const tierLabel = reward.tier === 'gold' ? 'GOLD'
                     : reward.tier === 'silver' ? 'SILBER'
                     : reward.tier === 'bronze' ? 'BRONZE'
                     : 'Weitermachen!';

      main.innerHTML = `
        <div class="layout-wrapper">
          <section class="panel">
            <h2>Fertig: ${ex.title}</h2>

            <p>✅ Richtig: <strong>${correct}</strong> · ❌ Falsch: <strong>${wrong}</strong></p>

            <div class="grid two">
              <div class="panel">
                <h3>Dein Ergebnis</h3>
                <p>Quote: <strong>${stats.ratio}%</strong>${deltaHtml}</p>
                <p>Ø letzte 5: <strong>${stats.last5Avg}%</strong></p>
                <p>Bestwert: <strong>${stats.bestRatio}%</strong> · Streak: <strong>${stats.streak}x</strong></p>
              </div>

              <div class="panel">
                <h3>Belohnung</h3>
                <p style="font-size:24px; margin:0;">${reward.tierIcon} ${tierLabel}</p>
                ${reward.progressSticker ? `<p class="badge" style="margin-top:8px;">${reward.progressSticker}</p>` : ''}
              </div>
            </div>

            <p style="margin-top:12px;"><a href="#/exercises">Weitere Übungen</a></p>
          </section>
        </div>`;
    }
  });
});

    Router.fallback(() => {
      const main = document.getElementById('app-main');
      main.innerHTML = `<div class="layout-wrapper">${NotFound.render()}</div>`;
    });
  },
};
