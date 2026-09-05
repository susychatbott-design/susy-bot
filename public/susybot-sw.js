// Susybot PWA Service Worker - Municipalidad de Ituzaingó
// Desarrollado por MyJNexoraVisual

const CACHE_NAME = "susybot-core-v2";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
  "/favicon.ico"
];

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("[SW] Advertencia al pre-cachear:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activación y control inmediato de clientes
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
    ])
  );
});


// Interceptor de Fetch (Requerido por Chrome/Android para instalación PWA nativa)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ignorar peticiones a APIs internas o Supabase o servicios en tiempo real
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase.co") ||
    event.request.method !== "GET"
  ) {
    return;
  }

  // Network First con fallback a Cache para el shell de la aplicación
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === "basic" &&
          (url.pathname === "/" || url.pathname.startsWith("/icons/"))
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (event.request.mode === "navigate") {
          const fallback = await caches.match("/");
          if (fallback) return fallback;
        }
        return new Response("Desconectado de la red municipal", {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      })
  );
});
