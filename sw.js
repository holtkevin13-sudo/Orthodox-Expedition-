// Orthodox Expedition — Service Worker
// Caches core assets for faster loading and basic offline support

const CACHE_NAME = 'orthodox-expedition-v1';
const STATIC_ASSETS = [
  '/Orthodox-Expedition-/',
  '/Orthodox-Expedition-/index.html',
  '/Orthodox-Expedition-/home.html',
  '/Orthodox-Expedition-/missions.html',
  '/Orthodox-Expedition-/curriculum.html',
  '/Orthodox-Expedition-/bazaar.html',
  '/Orthodox-Expedition-/games.html',
  '/Orthodox-Expedition-/favicon.svg',
  '/Orthodox-Expedition-/manifest.json',
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

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network first, cache fallback for HTML pages
self.addEventListener('fetch', event => {
  // Skip non-GET and Supabase API calls
  if(event.request.method !== 'GET') return;
  if(event.request.url.includes('supabase.co')) return;
  if(event.request.url.includes('googleapis.com')) return;
  if(event.request.url.includes('jsdelivr.net')) return;
  if(event.request.url.includes('github')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if(response.ok && response.type === 'basic'){
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(event.request).then(cached => {
          if(cached) return cached;
          // Offline fallback for HTML pages
          if(event.request.headers.get('Accept').includes('text/html')){
            return caches.match('/Orthodox-Expedition-/index.html');
          }
        });
      })
  );
});
