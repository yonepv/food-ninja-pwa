const staticCacheName = 'site-static-v4';
const dynanicCacheName = 'site-dynanic-v5';
const assets = [
    '/',
    '/index.html',
    '/js/app.js',
    '/js/ui.js',
    '/js/materialize.min.js',
    '/css/styles.css',
    '/css/materialize.min.css',
     '/img/dish.png',  
     'https://fonts.googleapis.com/icon?family=Material+Icons',
     'https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2',
     '/pages/fallback.html'
];

// cache size limit function
const limitCacheSize = (name, size) => {
    caches.open(name).then(cache => {
        cache.keys().then(keys => {
            if(keys.length > size){
                cache.delete(keys[0]).then(limitCacheSize(name, size));
            }
        })
    })
}

// install service worker
self.addEventListener('install', event => {
    //console.log('Service Worker: Installed');
    event.waitUntil(
        caches.open(staticCacheName).then(cache => {
            console.log('Service Worker: Caching Files');
            cache.addAll(assets)        
        })        
    )
});

// activate event
self.addEventListener('activate', event => {
    //console.log('Service Worker: Activated');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                .filter(cacheName => (cacheName != staticCacheName && cacheName != dynanicCacheName))
                .map(cacheName => caches.delete(cacheName))
            )
        })
    )
});

// fetch event 
self.addEventListener('fetch', event => {
    if(event.request.url.indexOf('firestore.googleapis.com') === -1){
        event.respondWith(
            caches.match(event.request).then(cacheRes => {
                return cacheRes || fetch(event.request).then(fetchRes => {
                    return caches.open(dynanicCacheName).then(cache => {
                        console.log(fetchRes);
                        cache.put(event.request.url, fetchRes.clone());
                        limitCacheSize(dynanicCacheName, 15);
                        return fetchRes;
                    })
                });
            }).catch(() => {
                if(event.request.url.indexOf('.html') > -1){
                    return caches.match('/pages/fallback.html');
                }
            })                    
        ); 
    }   
})