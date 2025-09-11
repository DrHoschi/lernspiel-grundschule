# Lernspiel Grundschule — Start-Setup (v0.1.0)

Dieses Repository enthält ein minimales Start-Setup für das Lernspiel (Klasse 1–4) inklusive:
- `index.html` (Einstiegsseite, einfache Router-Logik)
- `src/` JavaScript-Module (strukturierter Aufbau, ausführliche Kommentare)
- `assets/` Platzhalterordner für Bilder/Audio
- `docs/` mit Lastenheft (bitte Datei ablegen)
- `tests/` Basis für Unit-Tests

## Quickstart

1. Starte eine lokale Server-Instanz (z. B. via VS Code „Live Server“ oder Python):
   ```bash
   # Variante A (Python 3)
   python3 -m http.server 8080
   # Variante B (Node)
   npx http-server -p 8080
   ```
2. Öffne: http://localhost:8080

## Struktur

```
.
├── index.html
├── src/
│   ├── boot.js
│   ├── app.js
│   ├── router.js
│   ├── styles.css
│   ├── lib/
│   │   ├── storage.js
│   │   └── utils.js
│   ├── auth/
│   │   └── auth.js
│   └── ui/
│       ├── Navbar.js
│       ├── LoginForm.js
│       ├── DashboardParent.js
│       ├── DashboardChild.js
│       ├── ExercisesList.js
│       └── NotFound.js
├── assets/
├── docs/
└── tests/
```

## Hinweise
- Es gibt **keinen Backend-Zwang**. Authentifizierung ist vorerst **Mock/Client-seitig** (LocalStorage) und kann später durch echtes Backend ersetzt werden.
- Router ist Hash-basiert (`#/pfad`). Seiten: `/`, `/login`, `/parent`, `/child`, `/exercises`.
- UI ist minimal gehalten und bewusst ungestylt (nur `styles.css` als Basis).
