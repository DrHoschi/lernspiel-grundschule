/* =============================================================
 * ui/DashboardParent.js — v0.1.1
 * Eltern-Dashboard mit ersten Kennzahlen
 * ============================================================= */
import { Exercises } from '../data/exercises.js';

export const DashboardParent = {
  render(user) {
    const stats = Exercises.getUserStats(user.name || 'Kind');
    let totalAttempts = 0, totalCorrect = 0, totalWrong = 0, lastPlayed = '—';
    Object.values(stats).forEach(s => {
      totalAttempts += s.attempts;
      totalCorrect += s.correct;
      totalWrong += s.wrong;
      if (s.lastPlayedISO && (lastPlayed === '—' || s.lastPlayedISO > lastPlayed)) lastPlayed = s.lastPlayedISO;
    });
    const ratio = (totalCorrect + totalWrong) > 0 ? Math.round(100 * totalCorrect / (totalCorrect + totalWrong)) : 0;
    return `
      <section class="panel">
        <h2>Elternbereich</h2>
        <p>Willkommen, ${user.name}! Erste Kennzahlen:</p>
        <div class="grid two">
          <div class="panel">
            <h3>Gesamtleistung</h3>
            <p>Versuche: <strong>${totalAttempts}</strong></p>
            <p>Richtig: <strong>${totalCorrect}</strong> · Falsch: <strong>${totalWrong}</strong></p>
            <p>Quote: <strong>${ratio}%</strong></p>
            <p>Zuletzt gespielt: <strong>${lastPlayed !== '—' ? new Date(lastPlayed).toLocaleString() : '—'}</strong></p>
          </div>
          <div class="panel">
            <h3>Nach Übung</h3>
            <ul>
              ${Object.entries(stats).map(([exId, s]) => {
                const def = Exercises.getById(exId);
                const name = def ? def.title : exId;
                const r = (s.correct + s.wrong) > 0 ? Math.round(100 * s.correct / (s.correct + s.wrong)) : 0;
                return `<li>${name}: ${s.attempts} Versuche · ${r}% richtig</li>`;
              }).join('') || '<li>Noch keine Daten</li>'}
            </ul>
          </div>
        </div>
      </section>`;
  },
  bind(rootEl) {}
};
