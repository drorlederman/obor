/**
 * FCM push notification utility.
 * Reads FCM tokens from the `user_tokens` collection and sends via Firebase Messaging.
 *
 * Token structure: user_tokens/{userId} = { tokens: string[], updatedAt: Timestamp }
 */
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

interface PushNotification {
  title: string
  body: string
  data?: Record<string, string>
}

/** Send a push notification to specific user IDs. Silently skips users with no tokens. */
export async function sendPushToUsers(
  userIds: string[],
  notification: PushNotification,
): Promise<void> {
  if (userIds.length === 0) return

  const db = getFirestore()
  const messaging = getMessaging()

  // Collect all FCM tokens for given users
  const tokens: string[] = []
  await Promise.all(
    userIds.map(async (uid) => {
      const snap = await db.doc(`user_tokens/${uid}`).get()
      if (snap.exists) {
        const data = snap.data()!
        const userTokens = (data.tokens as string[]) ?? []
        tokens.push(...userTokens)
      }
    }),
  )

  if (tokens.length === 0) return

  // Send in batches of 500 (FCM limit)
  const BATCH_SIZE = 500
  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE)
    await messaging.sendEachForMulticast({
      tokens: batch,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
      android: { priority: 'high' },
      apns: { payload: { aps: { contentAvailable: true, sound: 'default' } } },
    })
  }
}

/** Send a push notification to all active members of a boat (except optionally the sender). */
export async function sendPushToBoatMembers(
  boatId: string,
  notification: PushNotification,
  excludeUserId?: string,
): Promise<void> {
  const db = getFirestore()

  const membersSnap = await db
    .collection('boat_members')
    .where('boatId', '==', boatId)
    .where('status', '==', 'active')
    .get()

  const userIds = membersSnap.docs
    .map((d) => d.data().userId as string)
    .filter((uid) => uid && uid !== excludeUserId)

  await sendPushToUsers(userIds, notification)
}
