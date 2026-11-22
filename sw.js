/* 서비스 워커: 앱 파일을 기기에 저장해 인터넷 없이도 열리게 한다.
   앱 파일을 고치면 아래 CACHE 이름의 숫자를 올려야 기기에 새 버전이 들어간다. */
const CACHE = "field-comment-v10";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 저장본을 먼저 보여 주고, 연결되어 있으면 뒤에서 새 파일로 갱신한다.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit || (req.mode === "navigate" ? caches.match("./index.html") : undefined));
      return hit || net;
    })
  );
});
