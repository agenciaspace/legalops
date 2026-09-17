/* Cache only the public offline page and icons. Never store authenticated HTML,
   API responses, user data, RSC payloads, or form submissions. */
const CACHE = 'legalops-club-shell-v2';
const OFFLINE = '/club-pwa/offline.html';
const STATIC = [OFFLINE, '/club-pwa/icon-192.png', '/club-pwa/icon-512.png', '/club-pwa/icon-maskable.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('legalops-club-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (STATIC.includes(url.pathname) && !url.search) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(url.pathname)).then(cached => cached || fetch(request)));
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.open(CACHE).then(cache => cache.match(OFFLINE)).then(cached => cached || new Response('Sem conexão. Reconecte e tente novamente.', {status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}}))));
  }
});
