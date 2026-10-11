// NEXUS — Service Worker
// Strategy: network-first for the app shell (so updates show up immediately),
// stale-while-revalidate for icons/fonts, cached copy only as an offline fallback.
const VERSION = '6.0';
const CACHE_NAME = 'nexus-v' + VERSION;
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const PRECACHE = [
  './manifest.json',
  './favicon.ico',
  './icon-16.png',
  './icon-32.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => Promise.allSettled(PRECACHE.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      // Only touch Nexus caches — this origin is shared with every other LAZLAB app.
      .then(keys => Promise.all(keys.filter(k => k.startsWith('nexus') && k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !FONT_HOSTS.includes(url.hostname)) return;

  // App shell (page, manifest, anything that isn't an image/font): network-first, bypass HTTP cache.
  const isAsset = sameOrigin && /\.(png|jpe?g|webp|svg|gif|ico|woff2?)$/i.test(url.pathname);
  if (sameOrigin && !isAsset) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(res => {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, copy)); }
          return res;
        })
        .catch(async () => (await caches.match(req)) || (req.mode === 'navigate' ? await caches.match('./index.html') : null) || new Response('', { status: 503 }))
    );
    return;
  }

  // Icons + fonts: serve cached instantly, refresh in the background.
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(req);
      const refresh = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      return cached || (await refresh) || new Response('', { status: 503 });
    })
  );
});

self.addEventListener('message', event => {
  const d = event.data;
  if (d === 'SKIP_WAITING') self.skipWaiting();
  if (d && d.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then(keys => Promise.all(keys.filter(k => k.startsWith('nexus')).map(k => caches.delete(k))))
        .then(() => event.ports[0] && event.ports[0].postMessage({ ok: true }))
    );
  }
});
