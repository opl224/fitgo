const CACHE_NAME = 'gemini-run-map-cache-v1';
const APP_CACHE_NAME = 'gemini-run-app-cache-v1';

// Install event
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Fetch event
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. Map Tiles (CartoDB) - Cache First Strategy
    // We prioritize the cache for tiles to ensure the map loads quickly and offline.
    // If not in cache, we fetch from network and update the cache.
    if (url.hostname.includes('cartocdn.com') || url.hostname.includes('openstreetmap.org')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(event.request).then(response => {
                    return response || fetch(event.request).then(networkResponse => {
                        // Check if valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                            return networkResponse;
                        }
                        
                        // Clone and Cache
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    }).catch(() => {
                        // If offline and not in cache, we just return nothing (grey tile)
                        // Leaflet handles missing tiles gracefully usually
                        return new Response(); 
                    });
                });
            })
        );
        return;
    }

    // 2. Critical Assets (CDNs for Scripts/Styles) - Stale While Revalidate
    // This allows the app shell to load offline if previously visited.
    const criticalDomains = [
        'unpkg.com', 
        'cdn.tailwindcss.com', 
        'aistudiocdn.com', 
        'fonts.googleapis.com', 
        'fonts.gstatic.com'
    ];
    
    if (criticalDomains.some(d => url.hostname.includes(d))) {
         event.respondWith(
            caches.open(APP_CACHE_NAME).then(cache => {
                return cache.match(event.request).then(cachedResponse => {
                    const fetchPromise = fetch(event.request).then(networkResponse => {
                        if(networkResponse && networkResponse.status === 200) {
                             cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(e => {
                        // Network failed
                        return cachedResponse; 
                    });
                    
                    // Return cached response immediately if available, otherwise wait for network
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }
});