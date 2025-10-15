const VERSION = 'bdc-sw-v1';
const CORE = ['/', '/offline.html', '/opengraph.png', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/favicon-32.png', '/icons/favicon-16.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== VERSION ? caches.delete(k) : null)))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request).then(r => r || caches.match('/offline.html')))
  );
});