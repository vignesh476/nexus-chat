self.addEventListener('push', function(event) {
  try {
    const payload = event.data ? event.data.json() : { title: 'New message', body: 'You have a new message' };
    const title = payload.title || 'New message';
    const options = {
      body: payload.body || '',
      data: payload.data || {},
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge.png'
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error('Push handling failed', e);
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: 'window' }).then(function(clientList) {
    for (var i = 0; i < clientList.length; i++) {
      var client = clientList[i];
      if (client.url && 'focus' in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow('/');
  }));
});