const CACHE_NAME = 'vendas-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon-192x192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Não interceptar requisições cross-origin (Supabase, APIs externas).
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      // Fallback de navegação: devolve o shell em cache, nunca undefined.
      const shell = await caches.match('/');
      return shell || Response.error();
    })
  );
});
