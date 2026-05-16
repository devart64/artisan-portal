const CACHE_NAME = 'artisan-portal-v1'
const STATIC_ASSETS = ['/', '/dashboard', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes API
  if (event.request.url.includes('/api/')) return

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  )
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data = {}
  try { data = event.data.json() } catch { data = { title: 'Artisan Portal', body: event.data.text() } }

  const title   = data.title || 'Artisan Portal'
  const options = {
    body:    data.body || '',
    icon:    data.icon || '/icon-192.png',
    badge:   '/icon-192.png',
    data:    { url: data.url || '/dashboard' },
    vibrate: [200, 100, 200],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(clients.openWindow(url))
})
