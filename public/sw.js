const CACHE_NAME = 'pdf-ai-toolkit-v3';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(k => caches.delete(k)));
    }).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Always fetch fresh network copies for JS/CSS assets
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
