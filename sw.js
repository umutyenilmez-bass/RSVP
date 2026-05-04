const CACHE_NAME = 'rsvp-app-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './rsvp-logo.png'
];

// Kurulum: Dosyaları önbelleğe al
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Aktivasyon: Eski önbellekleri temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// İstekleri Yönet: HTML için "Network First", diğerleri için "Cache First"
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ana sayfa veya HTML dosyaları için önce ağa git (Network First)
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Ağa ulaşılabiliyorsa önbelleği de güncelle
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request)) // İnternet yoksa önbelleği kullan
    );
  } else {
    // Diğer varlıklar (resim, manifest vb.) için önce önbellek (Cache First)
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
