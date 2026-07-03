const CACHE_NAME = 'eruul-bie-eruul-jin-v1';
const ASSETS = [
  './', './index.html', './style.css', './app.js', './manifest.json',
  './assets/hero.jpg', './assets/balance.jpg', './assets/energy.jpg'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
});
self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(res => res || fetch(event.request)));
});
