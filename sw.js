// CryptoEdge Service Worker - SELF-DESTRUCT
// This SW unregisters itself and clears all caches to fix stale cache issues.
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil((async () => {
        // Delete every cache
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
        // Unregister this service worker
        await self.registration.unregister();
        // Force-reload all open tabs so they get fresh content
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach(client => client.navigate(client.url));
    })());
});

// Never serve from cache — always network
self.addEventListener('fetch', e => {
    e.respondWith(fetch(e.request));
});
