/* ============================================================================
 * Datei   : src/ui/ExercisesList.js
 * Version : v0.6.0 (2025-11-11)
 * Zweck   : Übersicht aller Übungen (mit Badges + Titel-Emojis)
 * ========================================================================== */
import { Exercises } from '../data/exercises.js';

const OP_EMOJI = { add:'➕', sub:'➖', mul:'✖️', div:'➗' };

function titleWithEmoji(def){
  const ops = Array.isArray(def.config.ops) && def.config.ops.length
    ? def.config.ops
    : [def.config.op || 'mul'];
  const set = [...new Set(ops)];
  const prefix = set.map(o => OP_EMOJI[o] || '').join(' ');
  return `${prefix ? prefix+' ' : ''}${def.title}`;
}

export const ExercisesList = {
  render(){
    const items = Exercises.list();
    return `
      <section class="panel">
        <h2>Übungen</h2>
        ${items.map(def => `
          <div class="panel" style="margin-bottom:12px;">
            <div class="spread">
              <h3>${titleWithEmoji(def)}</h3>
              <span class="badge">${def.subject || 'Mathe'} · Klasse ${def.grade || '—'}</span>
            </div>
            <div class="form-actions">
              <a class="button" href="#/play/${def.id}">Start</a>
            </div>
          </div>
        `).join('')}
      </section>
    `;
  },
  bind(){ /* keine Logik nötig */ }
};
