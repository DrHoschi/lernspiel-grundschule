/* ============================================================================
 * Datei   : src/data/achievements.js
 * Version : v0.1.0
 * Zweck   : Achievements/Ziele je Kind + Bonus-Sticker bei Meilensteinen.
 * Store   : lernspiel.achievements = { [child]: { counts:{gold,silver,bronze,rocket}, bonuses:[{id,ts,icon,label}] } }
 *           lernspiel.stickers     = (schon vorhanden; hier hängen wir Bonus-Sticker an)
 * ========================================================================== */
import { Storage } from '../lib/storage.js';

const ACH_KEY = 'lernspiel.achievements';
const STICKERS_KEY = 'lernspiel.stickers';

const THRESHOLDS = [
  { id:'gold3',   key:'gold',   need:3,  icon:'🏆', label:'3× Gold' },
  { id:'gold5',   key:'gold',   need:5,  icon:'🌟', label:'5× Gold' },
  { id:'silver5', key:'silver', need:5,  icon:'🥈', label:'5× Silber' },
  { id:'bronze5', key:'bronze', need:5,  icon:'🥉', label:'5× Bronze' },
  { id:'rocket3', key:'rocket', need:3,  icon:'🚀', label:'3× Fortschritt' },
];

function nowISO(){ return new Date().toISOString(); }

function load(child){
  const db = Storage.get(ACH_KEY, {});
  if (!db[child]) db[child] = { counts:{ gold:0, silver:0, bronze:0, rocket:0 }, bonuses:[] };
  return db;
}
function save(db){ Storage.set(ACH_KEY, db); }
function hasBonus(bonuses, id){ return bonuses.some(b=>b.id===id); }

export const Achievements = {
  /** Wird nach jeder Runde aufgerufen */
  onRound(childName, reward, exerciseId){
    const db = load(childName);
    const rec = db[childName];
    if (reward.tier === 'gold')   rec.counts.gold++;
    if (reward.tier === 'silver') rec.counts.silver++;
    if (reward.tier === 'bronze') rec.counts.bronze++;
    if (reward.progressSticker)   rec.counts.rocket++;

    // Bonus-Sticker prüfen
    const gotNow = [];
    THRESHOLDS.forEach(t=>{
      if (rec.counts[t.key] >= t.need && !hasBonus(rec.bonuses, t.id)){
        const ts = nowISO();
        rec.bonuses.push({ id:t.id, ts, icon:t.icon, label:t.label });
        // auch in die allgemeine Sticker-Sammlung schreiben:
        const stickers = Storage.get(STICKERS_KEY, {});
        if (!stickers[childName]) stickers[childName] = [];
        stickers[childName].push({ ts, exerciseId, tier:'bonus', tierIcon:t.icon, progress:false, label:t.label });
        Storage.set(STICKERS_KEY, stickers);
        gotNow.push(t);
      }
    });

    save(db);
    return { counts:rec.counts, newBonuses: gotNow };
  },

  get(childName){
    const db = load(childName);
    return db[childName];
  }
};
