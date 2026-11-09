// Service worker per le notifiche push. Incolla gli stessi dati Firebase di index.html.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: "AIzaSyBCTmsiLTiJc9qzurFC4UGGwjWYuBCidIg",
  authDomain: "tessera-bar-turno-a.firebaseapp.com",
  projectId: "tessera-bar-turno-a",
  messagingSenderId: "780026148529",
  appId: "1:780026148529:web:d6f861e2dd63a5af935490"
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => l.length ? l[0].focus() : clients.openWindow('/')));
});
const messaging = firebase.messaging();
messaging.onBackgroundMessage(p => {
  const d = p.data || {};
  return self.registration.showNotification(d.title || 'Tessera Bar Turno A', {
    body: d.body || 'Nuovo aggiornamento.',
    icon: '/pompieri-bar.png'
  });
});
