# 📘 Projektbeschreibung – Lernspiel v2.0

**Projektname:** Lernspiel v2.0  
**Stand:** 11. November 2025  
**Autor:** A. Mann / Grundschule Lernen  
**Systemtyp:** Web-App (HTML + JS + CSS + LocalStorage)  
**Zielgruppe:** Kinder (Grundschule 1–4 Klasse) & Eltern (Übersicht)  
**Technik:** Vanilla JavaScript Module, hash-basierter Router, Event-basiertes UI-System  
**Ziel:** Selbstlern-Mathematik-Spiel mit Aufgaben-Generator, Fortschritts-Speicherung und Belohnungssystem.

---

## 1️⃣ Gesamtüberblick

Das Lernspiel besteht aus **mehreren Modulen**, die lose gekoppelt über Events und Shared Storage kommunizieren:

| Bereich | Datei | Funktion |
|----------|--------|-----------|
| **Daten & Persistenz** | `src/data/exercises.js` | Aufgaben-Definitionen, Speichern / Laden / Statistik |
| **Spiel-Logik** | `src/ui/ExercisePlay.js` | Spiel-Ablauf: Aufgaben generieren, prüfen, auswerten, Reward auslösen |
| **Übungs-Auswahl** | `src/ui/ExercisesList.js` | Übersicht, Auswahl (Operator + Zahlenraum), Start der Übung |
| **Belohnungssystem** | `src/data/achievements.js` *(extern, optional)* | Berechnet Medaille / Sticker, wird von ExercisePlay.js aufgerufen |
| **Ziele & Fortschritt** | `src/data/goals.js` *(extern, optional)* | Langzeit-Fortschritts-Tracking |
| **Router / App-Steuerung** | `src/app/router.js`, `src/app/App.js` | Wechsel zwischen Ansichten (z. B. Übersicht ↔ Übung ↔ Belohnung) |
| **UI / Style** | `ui/css/*.css` | visuelle Darstellung (HUD, Panels, Badges etc.) |

Kommunikation läuft über Events, z. B.  
`cb:exercise:finished`, `cb:stickers:updated`, `cb:rewards:earned`.

---

## 2️⃣ Modul-Beschreibungen

### 2.1 📁 `src/data/exercises.js`

**Verantwortung:**  
Zentrale Datenhaltung aller Übungen + Statistiksystem.  

**Funktionen:**
- `Exercises.list()` → liefert alle verfügbaren Übungsdefinitionen  
- `Exercises.getById(id)` → liefert eine Übung nach ID  
- `Exercises.saveAttempt(data)` → speichert einen abgeschlossenen Versuch mit Statistik  
- `Exercises.aggregateAllLocal()` → aggregiert Daten mehrerer Kinder  

**Datenstruktur:**
```js
{
  id: 'm-addition-2to10',
  title: 'Addition 2–10',
  subject: 'Mathe',
  grade: '1–2',
  config: {
    op: 'add',
    min: 2, max: 10,
    questions: 10,
    timeLimitSec: 120
  }
}
```

**Statistik (LocalStorage Key `lernspiel.progress`):**
```js
{
  "Kind": {
    "m-addition-2to10": {
      attempts: 5,
      correct: 43,
      wrong: 12,
      bestRatio: 94,
      streak: 3,
      history: [
        { ts:'2025-11-10', ratio: 90, correct: 9, wrong: 1, avgMs: 1200 }
      ],
      problems: {
        "7+8": { total: 3, wrong: 1, avgMs: 1200, bestMs: 880 }
      }
    }
  }
}
```

---

### 2.2 🎮 `src/ui/ExercisePlay.js`

**Verantwortung:**  
Steuert das aktive Spiel („Übung starten“).  
Generiert Aufgaben, prüft Antworten, berechnet Leistung und Rewards.

**Ablauf:**
1. Übung wird mit `Exercises.getById(id)` geladen.  
2. Aufgaben werden zufällig generiert (entsprechend `op` oder `ops`).  
3. Timer läuft (120 s Standard).  
4. Jede Eingabe wird geprüft → richtig/falsch + Zeit gemessen.  
5. Nach letztem Task:
   - `Exercises.saveAttempt()` speichert Ergebnis.
   - Belohnung wird über `Achievements.evaluate()` oder `onRound()` ermittelt.
   - Sticker wird über `Storage` gespeichert.
   - Events `cb:exercise:finished` + `cb:rewards:earned` werden gefeuert.
6. Fallback-UI zeigt Medaille (Gold / Silber / Bronze / 🎯).

**Zahlenraum-Logik:**  
Wenn in der Hash-URL `&range=1000` enthalten ist, wird `max=1000` gesetzt.  
→ Zahlenräume: 10 · 100 · 1 000 · 1 000 000.

**Events:**
- `cb:exercise:finished` → Übung beendet, Router oder UI reagiert.  
- `cb:stickers:updated` → neuer Sticker hinzugefügt.  
- `cb:rewards:earned` → Belohnung berechnet.

**Reward-Fallback:**
```js
ratio >= 90 → 🥇 gold
ratio >= 75 → 🥈 silver
ratio >= 60 → 🥉 bronze
else 🎯 none
```

---

### 2.3 📋 `src/ui/ExercisesList.js`

**Verantwortung:**  
Zeigt alle verfügbaren Übungen mit Operator-Emojis (blau) und Zahlenraum-Vorauswahl.

**UI-Elemente:**
- Operator-Emojis: `➕`, `➖`, `✖️`, `➗` (farbig #4da3ff)  
- Range-Buttons: 10 · 100 · 1 000 · 1 000 000  
- Start-Button → öffnet Übung via `#/exercise?id=…&range=…`

**Interaktionen:**
- Beim Klick auf eine Range-Taste → Button wird `is-active`.  
- Start-Button setzt Hash-Route (Übung beginnt).  
- Globaler Event-Listener:
  ```js
  window.addEventListener('cb:exercise:finished', () => {
    if (!location.hash.startsWith('#/exercise'))
      location.hash = '#/exercises';
  });
  ```
  → Sorgt dafür, dass nach Übungsende die Belohnung zuerst sichtbar bleibt und anschließend zurück navigiert wird.

---

### 2.4 🏅 `src/data/achievements.js`

**Verantwortung:**  
Verwaltet das Belohnungssystem.  
Zwei API-Varianten werden unterstützt:

| Variante | Beschreibung |
|-----------|---------------|
| `Achievements.evaluate(exId, stats)` | gibt Reward-Objekt zurück |
| `Achievements.onRound(child, reward, exId)` | registriert Belohnung im Langzeit-System |

**Reward-Objekt:**
```js
{
  tier: 'gold'|'silver'|'bronze'|'none',
  tierIcon: '🥇',
  progressSticker: '🚀 Fortschritt',
  ratio: 93, delta: +10, best: 100
}
```

---

### 2.5 🎯 `src/data/goals.js`

**Verantwortung:** Langfristige Ziele / Lernfortschritt pro Kind.

**Funktion (optional):**
```js
Goals.onRound(childName, correctCount);
```
– Erhöht Ziel-Counter oder schaltet Belohnungen frei.

---

### 2.6 ⚙️ Router und App-Struktur

**Router:**
- Hash-basiert (`#/<route>?id=…&range=…`)
- Bekannte Routen:
  - `#/exercises` → Übersicht
  - `#/exercise` → Spiel
  - `#/rewards` → Belohnungen (sofern vorhanden)

**App.js:**
```js
window.addEventListener('cb:exercise:finished', e => {
  location.hash = '#/exercises';
});
```

**Kommunikationsfluss:**
```
ExercisesList  →  ExercisePlay  →  Exercises.saveAttempt()
                                →  Achievements / Goals
                                →  Storage
                                →  Events cb:exercise:finished
```

---

## 3️⃣ Belohnungssystem (Sticker / Achievements)

**Speicherort:** `LocalStorage` Key `lernspiel.stickers`  
**Format:**
```js
{
  "Kind": [
    { ts:"2025-11-11T12:34:56Z", exerciseId:"m-addition-2to10", tier:"gold", tierIcon:"🥇" },
    { ts:"2025-11-11T12:35:10Z", exerciseId:"m-mixed-2to10", tier:"progress", tierIcon:"🚀" }
  ]
}
```

**Events:**  
`cb:stickers:updated` – Stickerliste aktualisieren  
`cb:rewards:earned` – neuer Reward wurde berechnet  

---

## 4️⃣ UI / Darstellung

**Panels:**  
– Holz-Rahmenoptik (CSS-Panels)  
– `<section class="panel">` = Container  
– `<div class="spread">` = Header mit Titel + Badge  
– `<div class="form-actions">` = Button-Leiste  

**Badges:** zeigen Klasse, Zeit oder Fortschritt.  
**Input:** Zahlenfeld mit Enter-Bestätigung.  
**Blaue Emojis:** in `.op-emoji` (`color:#4da3ff;`)

---

## 5️⃣ Events und Kommunikation

| Event | Gesendet von | Empfänger / Zweck |
|--------|---------------|-------------------|
| `cb:exercise:finished` | ExercisePlay | Router / UI (Navigation) |
| `cb:stickers:updated` | ExercisePlay | Rewards-Anzeige |
| `cb:rewards:earned` | ExercisePlay | Globale Erfolg-Anzeige |
| `cb:progress:changed` | Goals | Fortschritt-Anzeige |
| `cb:user:changed` | Login / Profil | UI anpassen |

---

## 6️⃣ Erweiterbarkeit

| Erweiterung | Vorgehensweise |
|--------------|----------------|
| **Neue Rechenarten** | In `exercises.js` neue Definition anlegen (op = 'pow', 'root' usw.) und in `ExercisePlay.OP` Generator hinzufügen. |
| **Andere Fächer** | `subject: "Deutsch"` + eigene ExercisePlay-Variante. |
| **Neue Zahlräume** | `RANGE_PRESETS` in `ExercisesList.js` erweitern. |
| **Automatische Weiterleitung nach Abschluss** | Im Listener Timeout einbauen: `setTimeout(()=>location.hash='#/rewards', 3000);` |
| **Belohnungs-Galerie** | `Rewards.js` mit Anzeige der Sticker nach Zeit/Art. |
| **Server-Sync** | `Storage` durch API-Aufrufe ersetzen. |

---

## 7️⃣ Technische Abhängigkeiten

- Keine externen Frameworks (reines JS)
- Lokale Speicherung über `window.localStorage`
- Hash-Routing (`window.location.hash`)
- Style-System via CSS Klassen
- Optional: Export / Import der Daten (Backup-Funktion)

---

## 8️⃣ Dateistruktur (v2.0)

```
📦 lernspiel-v2.0/
 ┣ 📂 src/
 │  ┣ 📂 data/
 │  │  ┣ exercises.js
 │  │  ┣ achievements.js
 │  │  ┗ goals.js
 │  ┣ 📂 ui/
 │  │  ┣ ExercisesList.js
 │  │  ┗ ExercisePlay.js
 │  ┗ 📂 app/
 │     ┣ App.js
 │     ┗ router.js
 ┣ 📂 ui/css/
 │  ┣ ui.css
 │  ┗ ui-theme-dark.css
 ┣ 📄 index.html
 ┗ 📄 Lastenheft_Lernspiel_v2.0.md
```

---

## 9️⃣ Speicher- und Versionierung

| Key | Inhalt | Datei |
|------|---------|--------|
| `lernspiel.progress` | Statistiken, Fehler, Historie | exercises.js |
| `lernspiel.stickers` | Belohnungen, Medaille | ExercisePlay.js |
| `lernspiel.user` | Aktueller Benutzer / Kind | App.js |

Versionierung:  
`v0.8.3 (ExercisePlay)` + `v0.3.2 (ExercisesList)` + `v0.8.2 (Exercises)`

---

## 🔟 Ergebnis / Status

✅ Alle Kernfunktionen aktiv:  
- Aufgaben-Generator (alle vier Grundrechenarten)  
- Zahlenraum-Auswahl  
- Fortschritts-Speicherung  
- Belohnungssystem (Gold / Silber / Bronze / 🚀)  
- Event-System und Fallback-Navigation  
- Optisch klare blau markierte Operatoren  
- Ergebnis-Anzeige bleibt sichtbar nach Abschluss

---

**Empfohlener Dateiname:**  
`/docs/Lastenheft_Lernspiel_v2.0.md`
