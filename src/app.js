/* =============================================================
 * Datei : src/app.js
 * Version: v0.2.1 (2025-10-20)
 * Zweck  : Zentrale App-Initialisierung inkl. Routing.
 *          Ab dieser Version werden ALLE Screens in einen
 *          <div class="layout-wrapper"> … </div> gerendert,
 *          damit die Breite/Abstände auf allen Displays
 *          (Portrait & Landscape) garantiert passen.
 *
 * Struktur:
 *   [A] Imports & State
 *   [B] App.init / Navbar
 *   [C] Routing (mit Wrapper)
 *   [D] Helper
 *
 * Hinweis:
 *   Die CSS-Klasse .layout-wrapper ist in src/styles.css definiert.
 *   Diese Datei sorgt NUR dafür, dass jede Route den Wrapper nutzt.
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

/* [A] Globaler App-State -------------------------------------- */
const AppState = { version: 'v0.2.1', user: null };

/* [B] App-Objekt ---------------------------------------------- */
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

  /* [C] Routing (ALLE Routen rendern in .layout-wrapper) ------- */
  configureRoutes() {
    // Startroute → redirect je nach Rolle
    Router.define('/', () => {
      const u = Auth.currentUser();
      if (!u) return Router.go('/login');
      AppState.user = u;
      if (u.role === 'parent') return Router.go('/parent');
      return Router.go('/child');
    });

    // Login
    Router.define('/login', () => {
      const main = document.getElementById('app-main');
      main.innerHTML = `<div class="layout-wrapper">${LoginForm.render()}</div>`;
      LoginForm.bind(main, {
        onSubmit: (payload) => {
          const user = Auth.login(payload);
          AppState.user = user;
          this.refreshNavbar();
          if (user.role === 'parent') Router.go('/parent');
          else Router.go('/child');
        }
      });
    });

    // Eltern-Dashboard
    Router.define('/parent', () => {
      const u = Auth.currentUser();
      const main = document.getElementById('app-main');
      if (!u || u.role !== 'parent') return Router.go('/login');
      AppState.user = u;
      main.innerHTML = `<div class="layout-wrapper">${DashboardParent.render(u)}</div>`;
      DashboardParent.bind(main);
    });

    // Kinder-Dashboard
    Router.define('/child', () => {
      const u = Auth.currentUser();
      const main = document.getElementById('app-main');
      if (!u || u.role !== 'child') return Router.go('/login');
      AppState.user = u;
      main.innerHTML = `<div class="layout-wrapper">${DashboardChild.render(u)}</div>`;
      DashboardChild.bind(main, { onStartExercises: () => Router.go('/exercises') });
    });

    // Übungsliste
    Router.define('/exercises', () => {
      const u = Auth.currentUser();
      const main = document.getElementById('app-main');
      if (!u || u.role !== 'child') return Router.go('/login');
      AppState.user = u;
      main.innerHTML = `<div class="layout-wrapper">${ExercisesList.render(u)}</div>`;
      ExercisesList.bind(main);
    });

    // Übung spielen
    Router.define('/exercise', ({ query }) => {
      const u = Auth.currentUser();
      const main = document.getElementById('app-main');
      if (!u || u.role !== 'child') return Router.go('/login');
      AppState.user = u;
      const id = query.get('id') || 'm-multiplication-2to10';
      main.innerHTML = `<div class="layout-wrapper">${ExercisePlay.render({ user: u, exerciseId: id })}</div>`;
      ExercisePlay.bind(main, {
        onFinish: ({ ex, correct, wrong }) => {
          main.innerHTML = `
            <div class="layout-wrapper">
              <section class="panel">
                <h2>Fertig: ${ex.title}</h2>
                <p>✅ Richtig: <strong>${correct}</strong></p>
                <p>❌ Falsch: <strong>${wrong}</strong></p>
                <p><a href="#/exercises">Weitere Übungen</a></p>
              </section>
            </div>`;
        }
      });
    });

    // Fallback 404
    Router.fallback(() => {
      const main = document.getElementById('app-main');
      main.innerHTML = `<div class="layout-wrapper">${NotFound.render()}</div>`;
    });
  },
};

/* [D] (Optional) künftige Helper
 * - z. B. zentraler Renderer, der automatisch den Wrapper injiziert,
 *   falls du später weitere Routen hinzufügst.
 */
