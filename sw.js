/* ==========================================
   SERVICE WORKER (sw.js) - Versión v2
   ========================================== */

const VERSION = "v2";
const ARCHIVOS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icono-192.png",
  "./icono-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((cache) => {
      return cache.addAll(ARCHIVOS);
    })
  );
});

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

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((respuestaCachable) => {
      return respuestaCachable || fetch(e.request);
    })
  );
});