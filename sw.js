self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    if (self.registration) await self.registration.unregister();
  })());
});
