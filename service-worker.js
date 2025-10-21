/* ============================================================
 * Datei: service-worker.js
 * Zweck: PWA-Offline-Cache für Lernspiel
 * ============================================================ */

const CACHE_VERSION = 'ls-v1.0.0';
const SHELL_CACHE = `shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// ⬇️ Liste der Kern-Dateien, die offline bereitstehen sollen.
// Passe die Pfade an DEIN Projekt an (alle relativ zum Projekt-Root).
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles.css',                 // falls vorhanden
  './icon_32.png',
  './icon_64.png',
  './icon_128.png',
  './icon_256.png',
  './icon_512.png',

  // Deine App-Dateien (füge weitere hinzu, wenn nötig)
  './src/app.js',
  './src/router.js',
  './src/lib/storage.js',
  './src/auth/auth.js',
  './src/ui/Navbar.js',
  './src/ui/LoginForm.js',
  './src/ui/DashboardChild.js',
  './src/ui/DashboardParent.js',
  './src/ui/ExercisesList.js',
  './src/ui/ExercisePlay.js',
  './src/ui/StatsDetail.js',
  './src/ui/TrainHard.js',
  './src/ui/ProgressBook.js',
  './src/ui/MilestonePoster.js',
  './src/ui/SuperRun.js',
  './src/ui/NotFound.js',
  './src/data/exercises.js',
  './src/data/achievements.js',
  './src/data/goals.js',

  // Offline-Fallback-Seite
  './offline.html'
];

// Install: App-Shell precachen
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Aktivieren: alte Caches aufräumen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (![SHELL_CACHE, RUNTIME_CACHE].includes(key)) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: Strategien nach Request-Typ
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Navigationsanfragen (HTML/Route-Wechsel) → Network-First + Offline-Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const respClone = resp.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, respClone));
          return resp;
        })
        .catch(async () => {
          const cache = await caches.open(RUNTIME_CACHE);
          const cached = await cache.match(request);
          return cached || caches.match('./offline.html');
        })
    );
    return;
  }

  // Statische Assets aus unserer Origin (JS/CSS/Module) → Cache-First
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'worker') {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((resp) => {
          const respClone = resp.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(request, respClone));
          return resp;
        })
      )
    );
    return;
  }

  // Bilder/Fonts → Stale-While-Revalidate
  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((resp) => {
          const respClone = resp.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, respClone));
          return resp;
        }).catch(() => cached); // bei Offline kein Fehler werfen
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Default: versuche Cache, sonst Netz
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
