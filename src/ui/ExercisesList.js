/* =============================================================
 * ui/ExercisesList.js — v0.1.0
 * Platzhalter-Liste für Übungen (Mathe/Deutsch je Klassenstufe).
 * ============================================================= */
export const ExercisesList = {
  render(user) {
    return `
      <section class="panel">
        <h2>Übungen (Demo)</h2>
        <p>Hier erscheinen später deine Aufgaben. Zum Start gibt es nur Platzhalter:</p>
        <ul>
          <li>Mathe — Einmaleins (Klasse 2)</li>
          <li>Deutsch — Wortarten (Klasse 3)</li>
          <li>Mathe — Schriftliches Addieren (Klasse 4)</li>
        </ul>
      </section>
    `;
  },
  bind(rootEl) {}
};
