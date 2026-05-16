// Service worker disabled - app works fully offline via localStorage/IndexedDB
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
// Pass all fetches through without caching
self.addEventListener('fetch', e => e.respondWith(fetch(e.request).catch(() => new Response('', {status: 503}))));
