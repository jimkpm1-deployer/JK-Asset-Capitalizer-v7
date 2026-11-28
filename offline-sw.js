/* Asset Capitalizer by JK - offline helper (session 11, Jim)
   Online: always loads the newest app from GitHub (network first) and keeps a copy on the device.
   Offline (internet shutdown): opens the last copy kept on the device.
   Your data never goes through this file: it stays in the browser storage of the device. */
var CACHE = "acap-offline-v1";
var FILES = ["./", "./index.html", "./manifest.json?v=2", "./icon-192.png?v=2", "./icon-512.png?v=2",
             "./icon-maskable-192.png", "./icon-maskable-512.png", "./apple-touch-icon.png?v=2", "./favicon.ico?v=2"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(FILES.map(function (u) { return c.add(new Request(u, { cache: "reload" })).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function fromCache(req) {
  return caches.open(CACHE).then(function (c) {
    return c.match(req, { ignoreSearch: req.mode === "navigate" }).then(function (r) {
      return r || (req.mode === "navigate" ? c.match("./index.html").then(function (x) { return x || c.match("./"); }) : undefined);
    });
  });
}
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(new Promise(function (resolve) {
    var done = false;
    function give(r) { if (!done && r) { done = true; resolve(r); } }
    // slow or blocked connection: after 6 s use the device copy if there is one
    var t = setTimeout(function () { fromCache(req).then(give); }, 6000);
    fetch(req, { cache: "no-cache" }).then(function (res) {
      clearTimeout(t);
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req.mode === "navigate" ? "./index.html" : req, copy); });
      }
      if (!done) { done = true; resolve(res); }
    }).catch(function () {
      clearTimeout(t);
      fromCache(req).then(function (r) {
        if (r) give(r);
        else if (!done) { done = true; resolve(new Response("<h3 style='font-family:sans-serif'>Asset Capitalizer is offline and was never opened on this device with internet. Connect once, then it will open offline.</h3>", { status: 503, headers: { "Content-Type": "text/html" } })); }
      });
    });
  }));
});
