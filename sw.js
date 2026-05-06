// Orthodox Expedition — Service Worker v5
// v5: adds topic-00-day.js for Lane 2 M/W/F rendering UI
// v4: adds week.html, prayers.html, day-state, pause-card, prayers, and config JSON
// Version bump forces cache clear and fresh install

const CACHE_NAME = 'orthodox-expedition-v5';
const STATIC_ASSETS = [
  '/Orthodox-Expedition-/',
  '/Orthodox-Expedition-/index.html',
  '/Orthodox-Expedition-/home.html',
  '/Orthodox-Expedition-/week.html',
  '/Orthodox-Expedition-/prayers.html',
  '/Orthodox-Expedition-/missions.html',
  '/Orthodox-Expedition-/curriculum.html',
  '/Orthodox-Expedition-/bazaar.html',
  '/Orthodox-Expedition-/games.html',
  '/Orthodox-Expedition-/journal.html',
  '/Orthodox-Expedition-/bible-reader.html',
  '/Orthodox-Expedition-/parent.html',
  '/Orthodox-Expedition-/favicon.svg',
  '/Orthodox-Expedition-/manifest.json',
  '/Orthodox-Expedition-/js/day-state.js',
  '/Orthodox-Expedition-/js/pause-card.js',
  '/Orthodox-Expedition-/js/prayers.js',
  '/Orthodox-Expedition-/js/topic-00-day.js',
  '/Orthodox-Expedition-/config/program-spine.json',
  '/Orthodox-Expedition-/config/daily-prayers.json',
];

// Install — cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.log('Cache addAll error (non-fatal):', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate — delete ALL old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        console.log('Deleting cache:', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, minimal caching
// Only cache static non-HTML assets — never cache HTML pages
self.addEventListener('fetch', event => {
  // Skip non-GET
  if(event.request.method !== 'GET') return;

  // Never intercept Supabase, CDN, or API calls
  const url = event.request.url;
  if(url.includes('supabase.co')) return;
  if(url.includes('googleapis.com')) return;
  if(url.includes('jsdelivr.net')) return;
  if(url.includes('github')) return;
  if(url.includes('cloudflareinsights')) return;

  // HTML pages — always network first, NO cache fallback
  // This prevents stale HTML from ever being served
  if(event.request.headers.get('Accept') &&
     event.request.headers.get('Accept').includes('text/html')){
    event.respondWith(
      fetch(event.request).catch(() => {
        // Only show offline message — never serve stale HTML
        return new Response(
          '<html><body style="font-family:sans-serif;text-align:center;padding:3rem;">' +
          '<h2>☩ You are offline</h2>' +
          '<p>Please reconnect to continue your expedition.</p>' +
          '</body></html>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      })
    );
    return;
  }

  // Static assets (images, fonts, icons) — cache after network
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if(response.ok && response.type === 'basic'){
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
