/* 加到主畫面（PWA）：有網路時一律拿最新版（伺服器沒改就只回 304，很快），沒網路或太慢才用上次存下來的檔案
 * 外部網址（雲端存檔、字型）不經過這裡 */
const CACHE = 'mist-v3';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('version.json')) return;
  const key = url.pathname.endsWith('/') || url.pathname.endsWith('index.html') ? url.origin + url.pathname : req;
  e.respondWith(caches.open(CACHE).then(async c => {
    const net = fetch(req, { cache: 'no-cache' }).then(r => { if (r.ok && r.type === 'basic') c.put(key, r.clone()); return r; });
    const hit = await c.match(key);
    if (!hit) return net;
    // 有舊檔：最多等 4 秒新版，網路壞掉或太慢就先用舊檔
    return Promise.race([net.catch(() => hit), new Promise(res => setTimeout(() => res(hit), 4000))]);
  }));
});
