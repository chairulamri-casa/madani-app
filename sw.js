const CACHE_NAME = "madani-cache-v1";
const APP_SHELL = ["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Network-first: selalu coba ambil versi terbaru dari internet dulu (supaya
// update aplikasi langsung kepakai), baru fallback ke cache kalau offline.
// Hanya diterapkan untuk file aplikasi sendiri (index.html, manifest, ikon) -
// permintaan ke Supabase/CDN lain dibiarkan lewat apa adanya.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isAppShell = url.origin === self.location.origin;
  if (!isAppShell || event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
