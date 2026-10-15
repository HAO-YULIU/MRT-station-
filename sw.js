/* 加到主畫面（PWA）：同網站的檔案先用快取（開很快），同時在背景下載新版，下次打開就是新版
 * 外部網址（雲端存檔、字型）不經過這裡 */
const CACHE = 'mist-v2';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'index.html', 'css/style.css', 'css/fx.css', 'js/vendor/three.min.js', 'assets/cover.jpg']).catch(() => {}))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: url.pathname.endsWith('/') || url.pathname.endsWith('index.html') });
    const net = fetch(req).then(r => { if (r.ok && r.type === 'basic') c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
