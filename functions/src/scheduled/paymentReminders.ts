import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { sendPaymentReminderEmail } from '../shared/email'
import { sendPushToUsers } from '../shared/notifications'

export const paymentReminders = onSchedule('every monday 09:00', async () => {
  const db = getFirestore()
  const now = Timestamp.now()

  // Find overdue and pending invoices
  const snap = await db
    .collection('partner_invoices')
    .where('status', 'in', ['open', 'partial', 'overdue'])
    .get()

  if (snap.empty) return

  // Group by partner
  const partnerInvoices: Record<string, { amount: number; boatId: string }[]> = {}

  for (const doc of snap.docs) {
    const data = doc.data()
    const partnerId = data.partnerId as string
    if (!partnerInvoices[partnerId]) {
      partnerInvoices[partnerId] = []
    }
    partnerInvoices[partnerId].push({
      amount: data.amountRemaining as number,
      boatId: data.boatId as string,
    })
  }

  const partnerCount = Object.keys(partnerInvoices).length
  console.log(
    `paymentReminders: ${partnerCount} partners have outstanding invoices at ${now.toDate().toISOString()}`,
  )

  // Send email + push to each partner
  await Promise.allSettled(
    Object.entries(partnerInvoices).map(async ([partnerId, invoices]) => {
      const partnerSnap = await db.doc(`partners/${partnerId}`).get()
      if (!partnerSnap.exists) return

      const partner = partnerSnap.data()!
      const totalOwed = invoices.reduce((sum, inv) => sum + inv.amount, 0)
      const boatId = invoices[0].boatId

      const notificationsSettingsSnap = await db.doc(`system_settings/${boatId}_notifications`).get()
      const invoicesEnabled = (notificationsSettingsSnap.data()?.invoices as boolean | undefined) ?? true
      if (!invoicesEnabled) return

      // Get boat name
      const boatSnap = await db.doc(`boats/${boatId}`).get()
      const boatName = (boatSnap.data()?.name as string) ?? 'OBOR'

      // Send email
      if (partner.email) {
        await sendPaymentReminderEmail(
          partner.email as string,
          partner.fullName as string,
          boatName,
          totalOwed,
        ).catch((err) => console.error(`Email failed for partner ${partnerId}:`, err))
      }

      // Send push notification
      if (partner.userId) {
        await sendPushToUsers([partner.userId as string], {
          title: `תזכורת תשלום — ${boatName}`,
          body: `נותרה יתרה לתשלום של ₪${totalOwed.toFixed(2)}`,
          data: { type: 'payment_reminder', boatId },
        }).catch((err) => console.error(`Push failed for partner ${partnerId}:`, err))
      }
    }),
  )
})
