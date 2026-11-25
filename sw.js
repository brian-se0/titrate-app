/*
 * Titrate's service worker. The build (vite.config.ts) fills in VERSION, BASE (the path the app is
 * served from, such as "/" or "/titrate-app/") and PRECACHE, the list of every file the app needs,
 * all under BASE. On install it caches them all; afterwards every request for the app is answered
 * from the cache, so the app loads and runs with no network. A new build has a new VERSION: it is
 * installed in the background and the old cache is removed when it activates. Cache names carry
 * BASE, so builds served from different paths of one origin leave each other's caches alone.
 */
const VERSION = "5dae70bfdffafda6";
const BASE = "/titrate-app/";
const PRECACHE = ["/titrate-app/","/titrate-app/assets/index-CH90Ftrc.js","/titrate-app/assets/index-CtoHA0v3.css","/titrate-app/icons/apple-touch-icon.png","/titrate-app/icons/icon-192.png","/titrate-app/icons/icon-512-maskable.png","/titrate-app/icons/icon-512.png","/titrate-app/index.html","/titrate-app/manifest.webmanifest"];
const PREFIX = `titrate:${BASE}:`;
const CACHE = `${PREFIX}${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      if (request.mode === 'navigate') {
        const page = (await cache.match(`${BASE}index.html`, { ignoreVary: true })) ?? (await cache.match(BASE, { ignoreVary: true }));
        if (page) return page;
      }
      // ignoreVary: a server may send Vary: Origin, and the module script and stylesheet are
      // requested with an Origin header (crossorigin) while the precache was filled without one.
      const cached = await cache.match(request, { ignoreSearch: true, ignoreVary: true });
      return cached ?? fetch(request);
    }),
  );
});
