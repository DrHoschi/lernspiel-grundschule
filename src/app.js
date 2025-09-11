/* =============================================================
 * app.js — v0.1.0
 * Zentrale App-Initialisierung: Navbar, Router, erste Route
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

const AppState = {
  version: 'v0.1.0',
  user: null, // { role: 'parent'|'child', name }
};

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

  refreshNavbar() {
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

  configureRoutes() {
    Router.define('/', () => {
      // Redirect je nach Login-Status
      const u = Auth.currentUser();
      if (!u) return Router.go('/login');
      AppState.user = u;
      if (u.role === 'parent') return Router.go('/parent');
      return Router.go('/child');
    });

    Router.define('/login', () => {
      const main = document.getElementById('app-main');
      main.innerHTML = LoginForm.render();
      LoginForm.bind(main, {
        onSubmit: (payload) => {
          const user = Auth.login(payload);
          AppState.user = user;
          App.refreshNavbar();
          if (user.role === 'parent') Router.go('/parent');
          else Router.go('/child');
        }
      });
    });

    Router.define('/parent', () => {
      const u = Auth.currentUser();
      const main = document.getElementById('app-main');
      if (!u || u.role !== 'parent') {
        return Router.go('/login');
      }
      main.innerHTML = DashboardParent.render(u);
      DashboardParent.bind(main);
    });

    Router.define('/child', () => {
      const u = Auth.currentUser();
      const main = document.getElementById('app-main');
      if (!u || u.role !== 'child') {
        return Router.go('/login');
      }
      main.innerHTML = DashboardChild.render(u);
      DashboardChild.bind(main, {
        onStartExercises: () => Router.go('/exercises')
      });
    });

        Router.define('/exercise', () => {
      const u = Auth.currentUser();
      const main = document.getElementById('app-main');
      if (!u || u.role !== 'child') return Router.go('/login');

      // id aus Hash-Query lesen (#/exercise?id=...)
      const params = new URLSearchParams((window.location.hash.split('?')[1] || ''));
      const id = params.get('id') || 'm-multiplication-2to10';

      main.innerHTML = ExercisePlay.render({ user: u, exerciseId: id });
      ExercisePlay.bind(main, {
        onFinish: ({ ex, correct, wrong, stats }) => {
          main.innerHTML = `
            <section class="panel">
              <h2>Fertig: ${ex.title}</h2>
              <p>✅ Richtig: <strong>${correct}</strong></p>
              <p>❌ Falsch: <strong>${wrong}</strong></p>
              <p><a href="#/exercises">Weitere Übungen</a></p>
            </section>
          `;
        }
      });
    });

    Router.fallback(() => {
      const main = document.getElementById('app-main');
      main.innerHTML = NotFound.render();
    });
  },
};
