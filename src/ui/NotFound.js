/* =============================================================
 * ui/NotFound.js — v0.1.0
 * 404-Fallback-Seite
 * ============================================================= */
export const NotFound = {
  render() {
    return `
      <section class="panel">
        <h2>Seite nicht gefunden</h2>
        <p>Die angeforderte Seite existiert (noch) nicht.</p>
        <p><a href="#/">Zurück zur Startseite</a></p>
      </section>
    `;
  }
};
