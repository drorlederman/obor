import { onCall } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { ensureRoleIn } from '../shared/auth'
import { Errors } from '../shared/errors'
import { serverTimestamp, runTransaction } from '../shared/firestore'
import { splitEqually } from '../shared/finance-utils'
import { writeAuditLog } from '../audit/writeAuditLog'

interface PublishChargeData {
  chargeId: string
}

export const publishCharge = onCall(async (request) => {
  const { chargeId } = request.data as PublishChargeData

  if (!chargeId) throw Errors.invalidArgument('chargeId הוא שדה חובה')

  const db = getFirestore()
  const chargeRef = db.doc(`charges/${chargeId}`)

  const chargeSnap = await chargeRef.get()
  if (!chargeSnap.exists) throw Errors.notFound('החיוב')

  const charge = chargeSnap.data()!
  const boatId = charge.boatId as string

  const { uid } = await ensureRoleIn(request, boatId, ['treasurer', 'admin'])

  if (charge.status !== 'draft') {
    throw Errors.preconditionFailed('ניתן לפרסם רק חיובים בסטטוס טיוטה')
  }

  // Query active partners
  const partnersSnap = await db
    .collection('partners')
    .where('boatId', '==', boatId)
    .where('status', '==', 'active')
    .get()

  if (partnersSnap.empty) {
    throw Errors.preconditionFailed('לא נמצאו שותפים פעילים לחיוב')
  }

  const activePartnerIds = partnersSnap.docs.map((d) => d.id)
  const splits = splitEqually(charge.totalAmount as number, activePartnerIds)

  await runTransaction(async (transaction) => {
    // Re-check charge status
    const chargeTransSnap = await transaction.get(chargeRef)
    if (!chargeTransSnap.exists) throw Errors.notFound('החיוב')
    if (chargeTransSnap.data()!.status !== 'draft') {
      throw Errors.preconditionFailed('החיוב כבר פורסם')
    }

    // Create invoice for each active partner
    for (const split of splits) {
      const invoiceRef = db.collection('partner_invoices').doc()
      transaction.set(invoiceRef, {
        boatId,
        chargeId,
        partnerId: split.partnerId,
        amount: split.amount,
        amountPaid: 0,
        amountRemaining: split.amount,
        status: 'open',
        dueDate: charge.dueDate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastPaymentAt: null,
      })
    }

    // Update charge status
    transaction.update(chargeRef, {
      status: 'published',
      updatedAt: serverTimestamp(),
    })
  })

  await writeAuditLog({
    boatId,
    action: 'charge.published',
    performedByUserId: uid,
    entityType: 'charge',
    entityId: chargeId,
    details: { totalAmount: charge.totalAmount, partnerCount: activePartnerIds.length },
  })

  await writeAuditLog({
    boatId,
    action: 'invoice.created',
    performedByUserId: uid,
    entityType: 'charge',
    entityId: chargeId,
    details: { invoiceCount: splits.length },
  })

  return { success: true, invoicesCreated: splits.length }
})
