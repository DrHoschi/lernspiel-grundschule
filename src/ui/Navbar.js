/* =============================================================
 * ui/Navbar.js — v0.1.0
 * Einfache Navigationsleiste mit Status + Logout.
 * ============================================================= */
export const Navbar = {
  render(state) {
    const user = state.user || null;
    return `
      <div class="spread">
        <div class="flex">
          <strong>📚 Lernspiel</strong>
          <span class="badge">${state.version}</span>
        </div>
        <nav class="flex">
          <a href="#/">Start</a>
          <a href="#/exercises">Übungen</a>
          <a href="#/login">Login</a>
          ${user ? `<span class="badge">Angemeldet: ${user.name} (${user.role})</span>
            <button id="btn-logout" class="ghost" title="Abmelden">Abmelden</button>` : ''}
        </nav>
      </div>
    `;
  },
  bind(rootEl, handlers) {
    const btn = rootEl.querySelector('#btn-logout');
    if (btn) btn.addEventListener('click', () => handlers.onLogout && handlers.onLogout());
  }
};
