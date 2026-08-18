// Service Worker untuk FingerPoint Push Notification
// Aktif di background untuk kirim reminder

const CACHE_NAME = 'fingerpoint-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Terima pesan dari main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_REMINDER') {
    scheduleReminder(event.data);
  }

  if (event.data && event.data.type === 'CANCEL_REMINDER') {
    cancelReminder();
  }
});

// Push notification dari server (jika pakai push service)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || 'Kamu belum absen hari ini!',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔔</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⏰</text></svg>',
    vibrate: [200, 100, 200],
    tag: data.tag || 'fingerpoint-reminder',
    requireInteraction: true,
    actions: [
      { action: 'absen', title: 'Absen Sekarang' },
      { action: 'later', title: 'Nanti Saja' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'FingerPoint Reminder', options)
  );
});

// Klik notifikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'absen') {
    // Buka app dan langsung ke halaman PIN
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        for (const client of clientList) {
          if (client.url.includes('index.html') && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow('/index.html');
      })
    );
  }
});

// Reminder scheduler di background
let reminderTimer = null;

function scheduleReminder(data) {
  cancelReminder();

  const delay = data.delay || 300000; // Default 5 menit
  reminderTimer = setTimeout(() => {
    self.registration.showNotification('⚠️ Belum Absen!', {
      body: 'Kamu belum absen hari ini. Buka FingerPoint untuk absen!',
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⏰</text></svg>',
      vibrate: [200, 100, 200],
      tag: 'reminder-' + new Date().toLocaleDateString('id-ID'),
      requireInteraction: true,
    });
  }, delay);
}

function cancelReminder() {
  if (reminderTimer) {
    clearTimeout(reminderTimer);
    reminderTimer = null;
  }
}
