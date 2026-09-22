/* ============================================================
   轻记账 LightBook · Service Worker v16
   更新策略：
   - sw.js 本身永不缓存（GitHub Pages 也要 Cache-Control: no-cache
     之外加这层保险），浏览器每次都拿最新
   - HTML / JS / manifest：网络优先（拿不到再用缓存）→ 发布新版即时生效
   - 字体 / 图标 / echarts 等大体积静态资源：缓存优先 + 后台更新
   - 安装容错：单个资源失败不阻塞整体
   ============================================================ */
var CACHE_NAME = 'lightbook-v16';
var APP_SHELL = [
  './',
  './index.html',
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
/* 必须即时生效的核心文件（网络优先） */
var FRESH = [/\/light-book\.html$/, /\/index\.html$/, /\/assets\/app\.js$/, /\/assets\/charts\.js$/, /\/manifest\.json$/];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        /* 逐个缓存，单个失败不影响整体安装 */
        return Promise.all(APP_SHELL.map(function (url) {
          return cache.add(url).catch(function () { /* 单资源失败容忍 */ });
        }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

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

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith('/sw.js')) return;

  var isFresh = FRESH.some(function (re) { return re.test(url.pathname); });

  if (isFresh) {
    /* 网络优先：在线拿最新，离线回退缓存 */
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, clone); });
        }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('./light-book.html');
        });
      })
    );
    return;
  }

  /* 其他静态资源：缓存优先 + 后台更新（stale-while-revalidate） */
  e.respondWith(
    caches.match(req).then(function (hit) {
      var fetching = fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, clone); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || fetching;
    }).catch(function () {
      return caches.match('./light-book.html');
    })
  );
});

/* 新版本就绪：通知页面可刷新 */
self.addEventListener('message', function (e) {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
