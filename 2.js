const CACHE_NAME = 'shaparak-analiz-v1';

// فایل‌های خودِ اپ (هم‌مبدأ) که همیشه از قبل کش می‌شوند
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './Yekan.ttf',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// استراتژی: Cache First با به‌روزرسانی در پس‌زمینه (stale-while-revalidate)
// همه‌چیز (فایل‌های خود اپ + کتابخانه‌های CDN مثل tailwind/chart.js/xlsx/pdf.js/katex)
// اولین‌بار که آنلاین باز شود کش می‌شود و از آن به بعد آفلاین هم کار می‌کند.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(() => cached); // آفلاین: اگر نسخه کش‌شده هست همان را بده

      return cached || fetchPromise;
    })
  );
});
