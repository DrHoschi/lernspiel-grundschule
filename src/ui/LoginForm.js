/* =============================================================
 * ui/LoginForm.js — v0.1.0
 * Minimaler Login (Role + Name) für Eltern/Kinder. Speichert im LocalStorage.
 * ============================================================= */
export const LoginForm = {
  render() {
    return `
      <section class="panel" aria-labelledby="login-title">
        <h2 id="login-title">Anmeldung</h2>
        <p>Wähle die Rolle und gib deinen Namen ein. (PoC: Kein Passwort erforderlich.)</p>
        <div class="form-row">
          <label for="role">Rolle</label>
          <select id="role" class="input">
            <option value="child">Kind</option>
            <option value="parent">Eltern</option>
          </select>
          <label for="name">Name</label>
          <input id="name" class="input" placeholder="Dein Name (optional)" />
        </div>
        <div class="form-actions">
          <button id="btn-login">Anmelden</button>
        </div>
      </section>
    `;
  },
  bind(rootEl, { onSubmit }) {
    rootEl.querySelector('#btn-login').addEventListener('click', () => {
      const role = rootEl.querySelector('#role').value;
      const name = rootEl.querySelector('#name').value.trim();
      onSubmit && onSubmit({ role, name });
    });
  }
};
