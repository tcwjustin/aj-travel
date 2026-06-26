const CACHE = "aj-travel-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Only handle our own files. Let cross-origin (Firebase, Leaflet, Google Fonts,
  // map tiles) go straight to the network so login & data keep working.
  if (url.origin !== self.location.origin) return;

  // Network-first for page loads so new deploys show up; fall back to cache offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((r) => { const cc = r.clone(); caches.open(CACHE).then((c) => c.put(req, cc)); return r; })
        .catch(() => caches.match(req).then((m) => m || caches.match("./index.html")))
    );
    return;
  }

  // Cache-first for static assets.
  e.respondWith(
    caches.match(req).then((m) => m || fetch(req).then((r) => {
      const cc = r.clone();
      caches.open(CACHE).then((c) => c.put(req, cc));
      return r;
    }))
  );
});
