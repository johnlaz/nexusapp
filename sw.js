// Nexus Suite Service Worker
// Strategy: Network-first for HTML/content, Cache-first for assets

const CACHE_NAME = 'nexus-v1';
const RUNTIME_CACHE = 'nexus-runtime-v1';

// Critical assets to pre-cache on install
const PRECACHE_URLS = [
  '/nexusapp/',
  '/nexusapp/index.html',
  '/nexusapp/manifest.json'
];

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Try to cache critical assets, don't fail if some missing
      return Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err =>
            console.warn(`[SW] Precache skipped: ${url}`)
          )
        )
      );
    }).then(() => {
      self.skipWaiting();
    })
  );
});

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== RUNTIME_CACHE)
          .map(key => {
            console.log(`[SW] Deleting old cache: ${key}`);
            return caches.delete(key);
          })
      )
    ).then(() => {
      self.clients.claim();
    })
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome extensions and non-http(s)
  if (!url.protocol.startsWith('http')) return;
  
  // External APIs: network-only with timeout
  if (url.origin !== self.location.origin) {
    return event.respondWith(
      Promise.race([
        fetch(request),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 8000)
        )
      ]).catch(() => new Response('', { status: 503 }))
    );
  }

  // ── HTML navigation: Network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          
          // Offline fallback
          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nexus Offline</title><style>body{background:#070b10;color:#e8f4f8;font-family:sans-serif;padding:2rem;text-align:center}h1{color:#00d4ff}</style></head><body><h1>Nexus is offline</h1><p>Check your connection and try again.</p></body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // ── Videos: Network-only (range requests)
  if (url.pathname.match(/\.(mp4|webm|ogv|mov)$/i)) {
    event.respondWith(
      fetch(request).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  // ── Static assets: Cache-first with background revalidation
  if (shouldCache(request)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(request);
        
        if (cached) {
          // Update cache in background
          fetch(request)
            .then(response => {
              if (response.ok) cache.put(request, response.clone());
            })
            .catch(() => {});
          return cached;
        }

        // Not cached: fetch from network
        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        } catch (error) {
          return new Response('', { status: 503 });
        }
      })
    );
    return;
  }

  // ── Default: Network-first
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached || new Response('', { status: 503 });
      })
  );
});

// ─── Helper ─────────────────────────────────────────────────────────────────
function shouldCache(request) {
  const { destination, url } = request;
  return (
    destination === 'style' ||
    destination === 'script' ||
    destination === 'image' ||
    destination === 'font' ||
    url.includes('.woff') ||
    url.includes('.woff2') ||
    url.includes('.png') ||
    url.includes('.jpg') ||
    url.includes('.jpeg') ||
    url.includes('.svg') ||
    url.includes('.gif')
  );
}

// ─── Message: Force update ───────────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    );
  }
});
