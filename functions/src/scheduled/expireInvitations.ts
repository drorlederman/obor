import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

export const expireInvitations = onSchedule('every 24 hours', async () => {
  const db = getFirestore()
  const now = Timestamp.now()

  const snap = await db
    .collection('invitations')
    .where('status', '==', 'pending')
    .where('expiresAt', '<', now)
    .get()

  if (snap.empty) return

  const BATCH_SIZE = 499
  let processed = 0

  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const chunk = snap.docs.slice(i, i + BATCH_SIZE)
    const batch = db.batch()

    for (const doc of chunk) {
      batch.update(doc.ref, { status: 'expired' })
      processed++
    }

    await batch.commit()
  }

  console.log(`expireInvitations: expired ${processed} invitations`)
})
