const CACHE = 'juice-shop-v9';
const URLS = [
  '/Juice-shop/',
  '/Juice-shop/index.html',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js'
];

// Install — sab cache karo
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return Promise.allSettled(URLS.map(url => c.add(url)));
    })
  );
  self.skipWaiting();
});

// Activate — purana cache delete karo
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — cache first, network fallback
self.addEventListener('fetch', e => {
  const url = e.request.url;
  
  // Firestore data requests — network only (offline mein fail hone do)
  if (url.includes('firestore.googleapis.com') && url.includes('/documents')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) {
        // Background mein update karo
        fetch(e.request).then(res => {
          if (res && res.ok) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
        }).catch(() => {});
        return cached;
      }
      // Cache mein nahi — network se lao aur cache karo
      return fetch(e.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Sab fail — app ka fallback
        if (e.request.mode === 'navigate') {
          return caches.match('/Juice-shop/index.html');
        }
      });
    })
  );
});
