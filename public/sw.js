const CACHE_NAME = 'brgyconnect-v2'
const STATIC_ASSETS = [
  '/',
  '/emergency',
  '/logo.jpg',
  '/manifest.json',
]

// Install: pre-cache critical static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch strategy handler
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // 1. Navigation & Emergency Contacts: Stale-While-Revalidate
  const isNavigation = request.mode === 'navigate'
  const isEmergency = url.pathname.includes('/emergency') || url.pathname.includes('emergency')

  if (isNavigation || isEmergency) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request)
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone())
            }
            return networkResponse
          })
          .catch(async () => {
            if (cachedResponse) return cachedResponse
            if (isEmergency) {
              const fallbackEmergency = await cache.match('/emergency')
              if (fallbackEmergency) return fallbackEmergency
            }
            const fallbackRoot = await cache.match('/')
            if (fallbackRoot) return fallbackRoot
            return new Response('Offline - Barangay Daine Connect', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' },
            })
          })

        return cachedResponse || fetchPromise
      })
    )
    return
  }

  // 2. Static Assets (js, css, images, fonts, manifest): Cache-First
  const isStaticAsset =
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|webp|avif|woff2?|ttf|eot)$/i) ||
    url.pathname.startsWith('/assets/') ||
    url.pathname === '/manifest.json'

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return networkResponse
        })
      })
    )
    return
  }

  // 3. Data requests (APIs, Supabase queries, dynamic server functions): Network-First with cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return networkResponse
      })
      .catch(() => caches.match(request))
  )
})
