// Background handler for FCM web push. Runs outside the Angular app, so the
// Firebase config is repeated here - these values are public by design.
importScripts('https://www.gstatic.com/firebasejs/12.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBeHdde0pv1hB5_mKCbe0sfO5AAkI5wmms',
  authDomain: 'familyops-6e2d1.firebaseapp.com',
  projectId: 'familyops-6e2d1',
  storageBucket: 'familyops-6e2d1.firebasestorage.app',
  messagingSenderId: '662115430672',
  appId: '1:662115430672:web:58fbcc7b84a09ba3147595',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  self.registration.showNotification(title ?? 'FamilyOps', {
    body: body ?? '',
    // Relative to the worker's own location, so it survives the
    // '/family-ops/' base path on GitHub Pages.
    icon: './icon-192.png',
    badge: './icon-192.png',
    dir: 'rtl',
    lang: 'he',
    // Collapse repeats of the same alert instead of stacking them.
    tag: payload.data?.key ?? title,
  });
});

// Tapping the notification focuses the app rather than opening a second copy.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow(self.registration.scope);
    })
  );
});
