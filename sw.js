/* ==========================================
   SERVICE WORKER (sw.js) - Versión Actualizada
   ========================================== */

const VERSION = "v2"; // Cambiamos de "v1" a "v2" para la actualización
const ARCHIVOS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icono-192.png",
  "./icono-512.png"
];

// Evento Install: guarda los archivos en la nueva caché
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((cache) => {
      return cache.addAll(ARCHIVOS);
    })
  );
  self.skipWaiting();
});

// Evento Activate: borra las cachés de versiones anteriores (como la "v1")
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

// Evento Fetch: responde primero con la caché
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((respuestaCachable) => {
      return respuestaCachable || fetch(e.request);
    })
  );
});