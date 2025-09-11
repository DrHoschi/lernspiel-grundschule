# 📘 Lastenheft – Lernspiel Grundschule (Klasse 1–4)

---

## 1. Projektübersicht
**Titel:** Digitales Lernspiel für Grundschulkinder (Klasse 1–4)  
**Ziel:**  
- Spielerisches Üben schulischer Inhalte (Start mit Mathematik, Erweiterung um Deutsch, Englisch etc.)  
- Motivation durch Belohnungssysteme (Avatare, Sammelobjekte, Mini-Spiele)  
- Eltern erhalten klare Auswertungen über Lernfortschritt und Schwächen  
- Kindgerechte Gestaltung (spielerisch), Elternansicht sachlich (klassisch, tabellarisch)  

---

## 2. Zielgruppen
- **Kinder:** 6–10 Jahre (Klasse 1–4), spielerische Motivation, intuitive Bedienung  
- **Eltern:** Erwachsene, wollen Lernfortschritt und Schwächen nachvollziehen  
- **Optional später:** Lehrkräfte mit Klassenübersicht  

---

## 3. Funktionen & Anforderungen

### 3.1 Benutzerverwaltung
- Elternkonto mit E-Mail/Passwort  
- Beliebig viele Kinderprofile je Elternkonto  
- Kind-Login über Profilbild + Bild-PIN (4 Symbole)  
- Profilwechsel: „Wer sitzt am Gerät?“  

### 3.2 Lerninhalte (Start: Mathematik)
- Klasse 1: Zahlraum bis 20/100, Plus/Minus, Verdoppeln/Halbieren, einfache Uhr  
- Klasse 2: Zahlraum bis 1000, Einmaleins, Geld, Zeit  
- Klasse 3: Multiplikation/Division größer, Maßeinheiten, Flächen/Umfang  
- Klasse 4: Schriftliches Rechnen, Brüche, Dezimalzahlen, Diagramme  
- Aufgabenpool als parametrisierte Vorlagen → zufällig generierte Aufgaben  

### 3.3 Übungsablauf
- Standardrunde: 10 Aufgaben  
- Adaptives System (richtig → schwieriger, falsch → leichter)  
- Fehlerwiederholung (spontan + später durch Spaced Repetition)  
- Runde endet mit Belohnung (Sticker, Punkte, Mini-Spiel-Ticket)  

### 3.4 Belohnungssystem
- Punkte/Sterne pro Aufgabe  
- Bonus für richtige Serien  
- Sammelobjekte (Stickeralbum)  
- Avatar-Freischaltungen (z. B. Kleidung, Tiere, Farben)  
- Mini-Spiele nach Runde (60–120 Sekunden, abschaltbar)  
- Wochen-Streaks = Medaillen  

### 3.5 Elternauswertung
- Dashboard: Aufgabenanzahl, Richtig/Falsch, Dauer, Themenübersicht  
- Fehleranalyse mit Empfehlungen (z. B. „7er-Reihe wiederholen“)  
- Vergleichswerte (Durchschnitt je Klassenstufe, anonymisiert, opt-in)  
- Wöchentliche E-Mail mit PDF-Report (klassisches „Übungsheft“-Layout)  
- Export als CSV/PDF  

### 3.6 Datenschutz
- DSGVO-konform (Datenminimierung, Löschrecht, Export)  
- Kinder ohne eigene E-Mail, nur über Elternkonto verwaltet  
- Datenhaltedauer: 24 Monate Inaktivität → automatische Löschinfo  
- Keine öffentlichen Rankings, nur anonymisierte Vergleiche  

### 3.7 Technik
- Plattform: Progressive Web App (PWA), offlinefähig  
- Responsive Design (Tablet/PC primär, Handy sekundär)  
- Elternbereich durch Eltern-PIN geschützt  
- Barrierefreiheit: große Buttons, Vorlesefunktion, optionale Schriften  

---

## 4. Systemarchitektur (grober Überblick)
- **Frontend:** PWA mit Offline-Cache  
- **Backend:** Benutzer- & Statistikdaten, Aufgaben-API  
- **Datenmodelle:**  
  - Parent: Login, Einstellungen, Kinder  
  - Child: Name, Klasse, Avatar, Fortschritt  
  - Progress: Aufgabenanzahl, Korrektquote, Dauer  
  - Rewards: Sticker, Punkte, Mini-Spiele  
- **Events:** login, start_round, finish_round, item_answered, reward_granted  

---

## 5. Nicht-funktionale Anforderungen
- **Datensicherheit:** Passwort-Hashing, E-Mail-Verifikation, Rate-Limits  
- **Performance:** Rundenstart < 2 Sekunden, Offlinefähigkeit  
- **Skalierbarkeit:** Mehrere Tausend Nutzer parallel  
- **Benutzerfreundlichkeit:**  
  - Kinder: farbenfrohe, intuitive Navigation  
  - Eltern: sachlich, klare Tabellen/Diagramme  

---

## 6. Erweiterungen (nach MVP)
- Deutsch: Rechtschreibung, Lesen, kleine Quizze  
- Englisch: Vokabeln, Hörübungen  
- Sachkunde: Natur, Jahreszeiten, Tiere  
- Lehreransicht: Klassenübersicht mit Gruppenauswertung  
- Gamification-Features: Freundevergleich (opt-in), Klassenrunden  

---

## 7. MVP-Umfang (Minimum Viable Product)
1. Eltern-Login + Verwaltung beliebig vieler Kinder  
2. Kind-Login mit Bild-PIN  
3. Mathematik (Kl. 1–2, Add/Sub bis 100, Einmaleins)  
4. Übungsrunden (10 Aufgaben, adaptiv, Fehlerwiederholung)  
5. Belohnungssystem (Sticker, Punkte, Avatarbasis)  
6. Eltern-Dashboard (heute/woche, Themenanalyse)  
7. Wöchentlicher E-Mail-Report mit PDF  
8. Vergleichswerte anonymisiert (opt-in)  
9. PWA offlinefähig  

---

## 8. Abnahmekriterien
- Alle Login- und Profilfunktionen funktionieren (Eltern/Kinder).  
- Kind kann mindestens 2 Mathe-Themen üben.  
- Fehler werden erkannt und wiederholt.  
- Eltern sehen Statistik (Tabellen, Diagramme).  
- Wöchentlicher Report wird per E-Mail/PDF verschickt.  
- Belohnungssystem sichtbar (Sticker/Avatare).  
- Datenschutzmaßnahmen umgesetzt (Export, Löschung).  
- App funktioniert offline und auf Tablet/PC.  

---

## 9. Offene Punkte (zu klären vor Umsetzung)
- E-Mail-Frequenz (Standard wöchentlich, täglich optional?)  
- Dauer Mini-Spiele (Default 90 Sek. pro Runde?)  
- Erstes Sammelset (z. B. Tiere oder Märchenfiguren?)  
- Vergleichswerte: nur Plattform-weit oder auch „Schulklasse“ per Join-Code?  

---

## 10. Zeitplan (Vorschlag)
- Phase 1 (4 Wochen): Login, Profile, Basis-UI  
- Phase 2 (6 Wochen): Mathe-Inhalte + Übungsengine  
- Phase 3 (4 Wochen): Belohnungen + Elternauswertung  
- Phase 4 (2 Wochen): Reports + PDF/E-Mail  
- Phase 5 (2 Wochen): Tests, Datenschutz, Feinschliff  

---

📂 **Empfohlener Dateiname im Projekt:**  
`docs/Lastenheft_Lernspiel.md`
