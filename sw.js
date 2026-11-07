/* ==========================================
   SERVICE WORKER (sw.js) - PWA OFFLINE
   ========================================== */

const VERSION = "v1";
const ARCHIVOS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icono-192.png",
  "./icono-512.png"
];

// Evento Install: guarda todos los archivos en la caché la primera vez
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((cache) => {
      return cache.addAll(ARCHIVOS);
    })
  );
  self.skipWaiting();
});

// Evento Activate: limpia las cachés de versiones anteriores
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== VERSION) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Evento Fetch: responde primero con la caché y si no hay, busca en la red
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((respuestaCachable) => {
      return respuestaCachable || fetch(e.request);
    })
  );
});