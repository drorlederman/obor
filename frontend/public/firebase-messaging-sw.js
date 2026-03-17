/* eslint-disable no-undef */
// Firebase Messaging Service Worker
// Handles background push notifications when the app is closed/minimized.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

// Firebase config is injected at runtime via the service worker's URL params
// or you can hardcode the project config here (it's safe — client-side config)
const firebaseConfig = {
  apiKey: self.__FIREBASE_API_KEY__ ?? '',
  authDomain: self.__FIREBASE_AUTH_DOMAIN__ ?? '',
  projectId: self.__FIREBASE_PROJECT_ID__ ?? '',
  storageBucket: self.__FIREBASE_STORAGE_BUCKET__ ?? '',
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID__ ?? '',
  appId: self.__FIREBASE_APP_ID__ ?? '',
}

firebase.initializeApp(firebaseConfig)
const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'OBOR'
  const body = payload.notification?.body ?? ''

  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    dir: 'rtl',
    lang: 'he',
    data: payload.data,
  })
})

// Handle notification click — open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus()
      } else {
        clients.openWindow('/')
      }
    }),
  )
})
