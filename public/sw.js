/**
 * Hamro Rent — Service Worker
 * Strategy: Cache-First for assets, Network-First for API/HTML.
 * Background Sync: replays offline mutations when connectivity returns.
 */

const CACHE_VERSION = "v3";
const STATIC_CACHE = `hamro-rent-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `hamro-rent-runtime-${CACHE_VERSION}`;

// Files to pre-cache on install (app shell)
const PRECACHE_URLS = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/icon-192x192.png",
  "/icon-512x512.png",
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== "GET") return;
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;
  // Skip TanStack server function RPC calls — these must always hit the network
  // They POST/GET to /_serverFn/<functionId> and must never be cached or intercepted
  if (url.pathname.startsWith("/_serverFn/")) return;
  // Skip Supabase and other external API calls
  if (url.hostname.includes("supabase.co")) return;

  // HTML navigation → Network-First, fallback to cached page, then /offline.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (!res.ok) return res;
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, clone));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match("/offline.html");
          return offline ?? new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
        })
    );
    return;
  }

  // Static assets (JS/CSS/fonts/icons) → Cache-First
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".webmanifest") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((res) => {
            if (!res.ok) return res;
            const clone = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
            return res;
          })
      )
    );
    return;
  }

  // Everything else → Network-First with runtime cache fallback
  // Must always resolve to a valid Response, never undefined
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (!res.ok) return res;
        const clone = res.clone();
        caches.open(RUNTIME_CACHE).then((c) => c.put(request, clone));
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached ?? new Response(JSON.stringify({ error: "Network unavailable" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      })
  );
});

// ── Background Sync ──────────────────────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "hamro-rent-sync") {
    event.waitUntil(notifyClientsToSync());
  }
});

// Tell the app to run its sync engine
async function notifyClientsToSync() {
  const clients = await self.clients.matchAll({ type: "window" });
  for (const client of clients) {
    client.postMessage({ type: "BACKGROUND_SYNC" });
  }
}

// ── Push Notifications (future-ready placeholder) ────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Hamro Rent", {
      body: data.body ?? "",
      icon: "/icon-192x192.png",
      badge: "/icon-72x72.png",
      data: { url: data.url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data?.url ?? "/")
  );
});
