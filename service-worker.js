/**
 * JAWAD CASH MANAGEMENT - OFFLINE SERVICE WORKER
 * Implements Cache-First strategies to guarantee sub-second loads and absolute offline autonomy.
 */

const CACHE_NAME = "jcm-static-v1.0.0";

// Assets to cache immediately on first install
const ASSETS_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./firebase-config.js",
    "./firebase.js",
    "./manifest.json",
    // CDNs are cached locally too so you aren't locked out of icons/styles offline
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
    "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap"
];

// 1. INSTALLATION EVENT: Cache all primary system shells
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("[Service Worker] Caching Application Shell files...");
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => {
            return self.skipWaiting();
        })
    );
});

// 2. ACTIVATION EVENT: Clean up older cache versions
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log("[Service Worker] Purging legacy application cache:", cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// 3. FETCH EVENT: Intercept requests and fallback to cache if offline
self.addEventListener("fetch", (event) => {
    // Skip non-GET requests (such as Firestore cloud updates or analytics)
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Fetch in background to update cache quietly for the next visit
                fetch(event.request).then((networkResponse) => {
                    if (networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, networkResponse);
                        });
                    }
                }).catch(() => { /* Ignore offline network-fetch failures silently */ });

                return cachedResponse;
            }

            // Fallback directly to the network if it isn't pre-cached
            return fetch(event.request).catch(() => {
                // If both fail and they tried to load HTML, point them back to the dashboard index
                if (event.request.headers.get("accept").includes("text/html")) {
                    return caches.match("./index.html");
                }
            });
        })
    );
});