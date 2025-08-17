const CACHE = 'songs-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './songs.json'
];

// Install: cache core + song files from songs.json
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE_ASSETS);

    // try to precache songs listed in songs.json (ignore failures)
    try {
      const res = await fetch('./songs.json', { cache: 'no-cache' });
      const list = await res.json();
      const urls = list.map(s => `./songs/${s.file}`);
      await cache.addAll(urls);
    } catch (e) {}
  })());
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
  })());
  self.clients.claim();
});

// Fetch: cache-first for same-origin requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin === location.origin) {
    event.respondWith(cacheFirst(event.request));
  }
});

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const fresh = await fetch(req);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}
