const CACHE_NAME = 'song-repertoire-cache-v1';
const urlsToCache = [
  '/',
  '/index.html', // This is the rendered version of index.md
  '/assets/main.css', // This is the compiled CSS file
  '/manifest.json',
  // Example of a cached song page. We use the permalink structure.
  '/songs/a-place-in-the-choir/',
  // The files below are needed for offline functionality
  '/assets/images/icon-192x192.png',
  '/assets/images/icon-512x512.png'
];

// Install event: caches the core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Add all specified URLs to the cache.
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event: serves cached content
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found.
        if (response) {
          return response;
        }
        // Otherwise, fetch from the network.
        return fetch(event.request);
      })
  );
});

// Activate event: deletes old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete any caches not in the whitelist.
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
