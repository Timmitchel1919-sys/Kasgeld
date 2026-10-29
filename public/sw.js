const CACHE_NAME = 'kasgeld-shell-v3'
const APP_SHELL = ['/', '/manifest.webmanifest', '/kasgeld-icon.svg']

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone()
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy))
    return response
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('/'))))
})

self.addEventListener('push', event => {
  if (!event.data) return
  let payload = {}
  try { payload = event.data.json() } catch { payload = { notification: { body: event.data.text() } } }
  const notification = payload.notification || payload.data?.notification || payload.data || {}
  event.waitUntil(self.registration.showNotification(notification.title || 'Kasgeld herinnering', {
    body: notification.body || 'Je hebt een nieuwe Kasgeld-melding.',
    icon: '/kasgeld-icon.svg',
    badge: '/kasgeld-icon.svg',
    data: { url: payload.fcmOptions?.link || payload.data?.link || '/' },
  }))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const existing = clients.find(client => 'focus' in client)
    return existing ? existing.focus() : self.clients.openWindow(event.notification.data?.url || '/')
  }))
})
