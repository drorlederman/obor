import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

export const markOverdueInvoices = onSchedule('every 24 hours', async () => {
  const db = getFirestore()
  const now = Timestamp.now()

  // Query open/partial invoices with past due date
  const snap = await db
    .collection('partner_invoices')
    .where('status', 'in', ['open', 'partial'])
    .where('dueDate', '<', now)
    .get()

  if (snap.empty) return

  const BATCH_SIZE = 499
  let processed = 0

  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const chunk = snap.docs.slice(i, i + BATCH_SIZE)
    const batch = db.batch()

    for (const doc of chunk) {
      const data = doc.data()
      const amountRemaining = data.amountRemaining as number
      if (amountRemaining > 0) {
        batch.update(doc.ref, {
          status: 'overdue',
          updatedAt: now,
        })
        processed++
      }
    }

    await batch.commit()
  }

  console.log(`markOverdueInvoices: marked ${processed} invoices as overdue`)
})
