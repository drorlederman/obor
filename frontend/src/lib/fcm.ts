/**
 * Firebase Cloud Messaging (FCM) setup for the frontend.
 * Call initFCM() once after the user logs in to request permission and save the token.
 */
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, arrayUnion } from 'firebase/firestore'
import { app, db } from './firebase'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined

/** Request notification permission, get FCM token, and save it to Firestore. */
export async function initFCM(userId: string): Promise<void> {
  if (!VAPID_KEY) {
    console.warn('FCM: VITE_FIREBASE_VAPID_KEY not set — push notifications disabled')
    return
  }

  if (!('Notification' in window)) return

  // Register service worker
  if (!('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const messaging = getMessaging(app)

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    if (token) {
      // Save token to user_tokens collection (merge to support multiple devices)
      await setDoc(
        doc(db, 'user_tokens', userId),
        { tokens: arrayUnion(token), updatedAt: new Date() },
        { merge: true },
      )
    }
  } catch (err) {
    console.error('FCM init failed:', err)
  }
}

/** Subscribe to foreground messages (app is open). */
export function onForegroundMessage(
  handler: (title: string, body: string) => void,
): () => void {
  const messaging = getMessaging(app)
  return onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? ''
    const body = payload.notification?.body ?? ''
    handler(title, body)
  })
}
