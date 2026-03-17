import { onCall } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { ensureActiveMemberOf } from '../shared/auth'
import { Errors } from '../shared/errors'
import { serverTimestamp, runTransaction } from '../shared/firestore'
import { writeAuditLog } from '../audit/writeAuditLog'

interface CancelBookingData {
  bookingId: string
}

export const cancelBooking = onCall(async (request) => {
  const { bookingId } = request.data as CancelBookingData

  if (!bookingId) throw Errors.invalidArgument('bookingId הוא שדה חובה')

  const db = getFirestore()
  const bookingRef = db.doc(`bookings/${bookingId}`)

  const bookingSnap = await bookingRef.get()
  if (!bookingSnap.exists) throw Errors.notFound('ההזמנה')

  const booking = bookingSnap.data()!
  const boatId = booking.boatId as string

  const { uid, role } = await ensureActiveMemberOf(request, boatId)

  // Only owner or scheduler/admin can cancel
  const isOwner = booking.createdByUserId === uid
  const hasPrivilege = role === 'scheduler' || role === 'admin'
  if (!isOwner && !hasPrivilege) {
    throw Errors.permissionDenied('רק בעל ההזמנה או מתזמן/מנהל יכולים לבטל הזמנה')
  }

  if (booking.status === 'cancelled') {
    throw Errors.preconditionFailed('ההזמנה כבר בוטלה')
  }
  if (booking.status === 'completed') {
    throw Errors.preconditionFailed('לא ניתן לבטל הזמנה שהסתיימה')
  }

  const creditsToRefund = (booking.creditsUsed as number) ?? 0
  const creditType = booking.creditType as 'weekday' | 'weekend' | null
  const ownerPartnerId = booking.ownerPartnerId as string

  await runTransaction(async (transaction) => {
    // Re-check booking status inside transaction
    const bookingTransSnap = await transaction.get(bookingRef)
    if (!bookingTransSnap.exists) throw Errors.notFound('ההזמנה')
    if (bookingTransSnap.data()!.status === 'cancelled') {
      throw Errors.preconditionFailed('ההזמנה כבר בוטלה')
    }

    // Update booking
    transaction.update(bookingRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancelledByUserId: uid,
      updatedAt: serverTimestamp(),
    })

    // Refund credits if applicable
    if (creditsToRefund > 0 && creditType) {
      const partnerRef = db.doc(`partners/${ownerPartnerId}`)
      const partnerSnap = await transaction.get(partnerRef)

      if (partnerSnap.exists) {
        const partnerData = partnerSnap.data()!
        const balanceField = creditType === 'weekday' ? 'weekdayCreditsBalance' : 'weekendCreditsBalance'
        const currentBalance =
          creditType === 'weekday' ? partnerData.weekdayCreditsBalance : partnerData.weekendCreditsBalance
        const newBalance = currentBalance + creditsToRefund

        transaction.update(partnerRef, {
          [balanceField]: FieldValue.increment(creditsToRefund),
          updatedAt: serverTimestamp(),
        })

        const creditTxRef = db.collection('credit_transactions').doc()
        transaction.set(creditTxRef, {
          boatId,
          partnerId: ownerPartnerId,
          bookingId,
          type: 'refund',
          creditType,
          amount: creditsToRefund,
          balanceAfter: newBalance,
          description: `ביטול הזמנה: ${booking.title}`,
          createdByUserId: uid,
          createdAt: serverTimestamp(),
        })
      }
    }
  })

  await writeAuditLog({
    boatId,
    action: 'booking.cancelled',
    performedByUserId: uid,
    entityType: 'booking',
    entityId: bookingId,
    details: { creditsRefunded: creditsToRefund },
  })

  return { success: true }
})
