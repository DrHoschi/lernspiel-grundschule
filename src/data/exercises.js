/* =============================================================
 * data/exercises.js — v0.1.0
 * Übungsdefinitionen + Progress-Storage (LocalStorage).
 * ============================================================= */
import { Storage } from '../lib/storage.js';

const PROGRESS_KEY = 'lernspiel.progress';

export const Exercises = {
  // Katalog (später beliebig erweiterbar)
  catalog: [
    {
      id: 'm-multiplication-2to10',
      subject: 'Mathe',
      title: 'Einmaleins 2–10',
      grade: '2',
      type: 'multiplication',
      config: { min: 2, max: 10, questions: 10, timeLimitSec: 120 }
    }
  ],

  list() {
    return this.catalog;
  },

  getById(id) {
    return this.catalog.find(x => x.id === id) || null;
  },

  // Progress-Struktur:
  // { [userName]: { [exerciseId]: { attempts: number, correct: number, wrong: number, lastPlayedISO: string } } }
  getProgress() {
    return Storage.get(PROGRESS_KEY, {});
  },

  saveAttempt({ userName, exerciseId, correctCount, wrongCount }) {
    const db = this.getProgress();
    db[userName] = db[userName] || {};
    const cur = db[userName][exerciseId] || { attempts: 0, correct: 0, wrong: 0, lastPlayedISO: null };
    cur.attempts += 1;
    cur.correct += correctCount;
    cur.wrong += wrongCount;
    cur.lastPlayedISO = new Date().toISOString();
    db[userName][exerciseId] = cur;
    Storage.set(PROGRESS_KEY, db);
    return cur;
  },

  getUserStats(userName) {
    const db = this.getProgress();
    return db[userName] || {};
  }
};
