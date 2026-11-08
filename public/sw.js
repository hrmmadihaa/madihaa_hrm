const CACHE_NAME = 'mwsc-hrms-v2';

self.addEventListener('install', (event) => {
  // Skip installation - don't pre-cache anything
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Skip caching entirely - always fetch from network
  // This prevents quota exceeded errors
  event.respondWith(fetch(event.request));
});

self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});
