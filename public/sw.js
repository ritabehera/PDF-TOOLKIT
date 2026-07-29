const CACHE_NAME = 'pdf-ai-toolkit-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Network-first strategy to ensure real-time UI updates
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
