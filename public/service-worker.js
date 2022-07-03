const STATIC_CACHE = 'static_cache_v1'
const DATA_CACHE = 'data_cache_v1'

const FILES_TO_CACHE = [
    './index.html',
    './css/styles.css',
    './js/index.js',
    './js/idb.js',
    './manifest.json',
    './icons/icon-512x512.png',
    './icons/icon-384x384.png',
    './icons/icon-192x192.png',
    './icons/icon-152x152.png',
    './icons/icon-144x144.png',
    './icons/icon-128x128.png',
    './icons/icon-96x96.png',
    './icons/icon-72x72.png'
]

const swIcon = `🤖 (SW): `

self.addEventListener('install', event => {
  console.log(`${swIcon} Installing...`)
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(FILES_TO_CACHE))
  )
  self.skipWaiting() // forces the waiting sevice worker to become the active service worker: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting
})

self.addEventListener('activate', event => {
  console.log(`${swIcon} Activating...`)
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== STATIC_CACHE) {
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim() // active service worker to set itself as the controller for all clients within its scope: https://developer.mozilla.org/en-US/docs/Web/API/Clients/claim
})

self.addEventListener('fetch', event => {
  console.log(`${swIcon} Requesting `, event.request)
  // Requests for data
  // Strategy: Network-first, fallback to cache
  if (event.request.url.includes('dummyjson.com') && event.request.method === 'GET') {
    event.respondWith(
      // open caches
      caches.open(DATA_CACHE)
        .then(cache => {
          // try network with a fetch request
          return fetch(event.request)
            .then(response => {
              // if success
              if (response.status === 200) {
                // save response in cache
                cache.put(event.request.url, response.clone())
              }
              return response
            })
            // if fails pull last saved data from cache
            .catch(() => caches.match(event.request))
        })
        .catch(err => console.log(err))
    )
    return
  }

  // Request for static assets (.html, .css, .js, .jpg, .png)
  // Strategy: Cache-first, fallback to Network
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  )
})