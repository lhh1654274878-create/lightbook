/* ============================================================
   轻记账 LightBook · Service Worker
   首次访问后缓存全部资源，之后完全离线可用
   ============================================================ */
var CACHE_NAME = 'lightbook-v3';
var APP_SHELL = [
  './',
  './light-book.html',
  './manifest.json',
  './assets/app.js',
  './assets/charts.js',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './_shared/js/echarts.min.js',
  './_shared/fonts/WorkSans-Regular.ttf',
  './_shared/fonts/WorkSans-Bold.ttf'
];

/* 安装：缓存应用外壳 */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

/* 激活：清理旧缓存 */
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k !== CACHE_NAME;
      }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* 请求：缓存优先，离线可用 */
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return; // 不代理跨域
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, clone); });
        }
        return res;
      }).catch(function () {
        return caches.match('./light-book.html');
      });
    })
  );
});
