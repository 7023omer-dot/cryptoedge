// CryptoEdge Service Worker - v4 cache bust
const CACHE_NAME = 'cryptoedge-v4';

self.addEventListener('install', e => {
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    // Always go to network — no caching
    e.respondWith(fetch(e.request));
});
