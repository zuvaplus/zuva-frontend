/**
 * Zuva.TV Service Worker
 * Strategy:
 *   - Static assets  → cache-first (fonts, images, JS/CSS bundles)
 *   - API calls      → network-first with no offline fallback
 *   - Navigation     → network-first, fall back to cached shell ('/')
 */

const CACHE = 'zuva-v1';

const APP_SHELL = [
  '/',
  '/feed',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ── Install: prime the cache with the app shell ───────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ── Activate: purge stale caches from previous versions ──────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: routing logic ──────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept same-origin GET requests
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  // API routes: network-first, no offline fallback (stale data would mislead)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // Static assets (JS chunks, CSS, fonts, images): cache-first, update in bg
  if (/\.(js|css|woff2?|png|jpg|jpeg|svg|ico|webp)(\?.*)?$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        });
        return cached ?? networkFetch;
      })
    );
    return;
  }

  // Navigation (HTML pages): network-first, fall back to shell
  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then((cached) => cached ?? caches.match('/'))
    )
  );
});
