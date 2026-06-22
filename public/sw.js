'use strict'

const CACHE = 'poseidon-v1'

// Sofort aktivieren ohne auf alte Clients zu warten
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  // Nur GET-Requests vom eigenen Origin
  if (request.method !== 'GET') return
  if (url.origin !== location.origin) return
  // API-Calls nie cachen — immer frische Daten
  if (url.pathname.startsWith('/api/')) return

  // Content-hashed Next.js-Assets: Cache-First (ändert sich nie)
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(request).then((hit) =>
        hit || fetch(request).then((res) => {
          caches.open(CACHE).then((c) => c.put(request, res.clone()))
          return res
        })
      )
    )
    return
  }

  // Bilder und Fonts: Cache-First
  if (/\.(png|jpg|jpeg|svg|ico|webp|woff2?)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(request).then((hit) =>
        hit || fetch(request).then((res) => {
          caches.open(CACHE).then((c) => c.put(request, res.clone()))
          return res
        })
      )
    )
    return
  }

  // HTML-Seiten: Network-First, bei Offline Cache-Fallback
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put(request, res.clone()))
          return res
        })
        .catch(() =>
          caches.match(request).then((hit) => hit || caches.match('/'))
        )
    )
  }
})
