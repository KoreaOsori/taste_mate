// Basic Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only intercept same-origin requests to avoid CORS issues with Supabase/APIs
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(fetch(event.request));
  }
});
