/* =============================================================
 * ui/DashboardChild.js — v0.1.0
 * Kinder-Dashboard (Platzhalter): Start in Übungen / Mini-Spiele.
 * ============================================================= */
export const DashboardChild = {
  render(user) {
    return `
      <section class="panel">
        <h2>Hallo ${user.name || '👋'}</h2>
        <p>Bist du bereit? Lass uns üben!</p>
        <div class="form-actions">
          <button id="btn-start">Übungen starten</button>
        </div>
      </section>
    `;
  },
  bind(rootEl, { onStartExercises }) {
    rootEl.querySelector('#btn-start').addEventListener('click', () => {
      onStartExercises && onStartExercises();
    });
  }
};
