self.addEventListener('push', function (event) {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/dashboard' },
    vibrate: [200, 100, 200],
    actions: [{ action: 'open', title: 'Abrir' }],
  }

  event.waitUntil(self.registration.showNotification(data.title || 'LegalOps', options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(clients.openWindow(url))
})
