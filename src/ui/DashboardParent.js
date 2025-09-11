/* =============================================================
 * ui/DashboardParent.js — v0.1.0
 * Eltern-Dashboard (Platzhalter): Übersicht Kinder, Fortschritt.
 * ============================================================= */
export const DashboardParent = {
  render(user) {
    return `
      <section class="panel">
        <h2>Elternbereich</h2>
        <p>Willkommen, ${user.name}! Hier siehst du später alle Kinder, Statistiken und Auswertungen.</p>
        <div class="grid two">
          <div class="panel">
            <h3>Meine Kinder</h3>
            <p>Noch keine Einträge. (Später: Verwaltung, Nutzerzuordnung, Klassenstufe.)</p>
          </div>
          <div class="panel">
            <h3>Auswertung</h3>
            <p>Später: Diagramme, Vergleich zu Klassendurchschnitt, Stärken/Schwächen.</p>
          </div>
        </div>
      </section>
    `;
  },
  bind(rootEl) {}
};
