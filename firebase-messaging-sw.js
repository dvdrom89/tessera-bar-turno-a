// Service worker per le notifiche push. Incolla gli stessi dati Firebase di index.html.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: "INCOLLA",
  authDomain: "INCOLLA",
  projectId: "INCOLLA",
  messagingSenderId: "INCOLLA",
  appId: "INCOLLA"
});
const messaging = firebase.messaging();
messaging.onBackgroundMessage(p => {
  const d = p.data || {};
  self.registration.showNotification(d.title || 'Tessera Bar Turno A', { body: d.body || 'Nuovo aggiornamento.', tag: 'bar-update' });
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => l.length ? l[0].focus() : clients.openWindow('/')));
});
