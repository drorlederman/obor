import { onCall } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { ensureActiveMemberOf } from '../shared/auth'
import { Errors } from '../shared/errors'
import { serverTimestamp, runTransaction } from '../shared/firestore'
import { calculateCreditCost } from '../shared/booking-utils'
import { writeAuditLog } from '../audit/writeAuditLog'

interface JoinPartnerSailData {
  bookingId: string
  partnerPartnerId: string // The joining partner's partner document ID
}

export const joinPartnerSail = onCall(async (request) => {
  const { bookingId, partnerPartnerId } = request.data as JoinPartnerSailData

  if (!bookingId) throw Errors.invalidArgument('bookingId הוא שדה חובה')
  if (!partnerPartnerId) throw Errors.invalidArgument('partnerPartnerId הוא שדה חובה')

  const db = getFirestore()
  const bookingRef = db.doc(`bookings/${bookingId}`)

  const bookingSnap = await bookingRef.get()
  if (!bookingSnap.exists) throw Errors.notFound('ההזמנה')

  const booking = bookingSnap.data()!
  const boatId = booking.boatId as string

  const { uid } = await ensureActiveMemberOf(request, boatId)

  // Validate booking type
  if (booking.type !== 'partner_sail') {
    throw Errors.preconditionFailed('ניתן להצטרף רק להזמנות שיט משותף')
  }

  if (booking.status !== 'active') {
    throw Errors.preconditionFailed('לא ניתן להצטרף להזמנה שאינה פעילה')
  }

  // Check booking is in the future
  const startTime = booking.startTime.toDate() as Date
  if (startTime <= new Date()) {
    throw Errors.preconditionFailed('לא ניתן להצטרף להזמנה שכבר התחילה')
  }

  // Load partner to verify ownership
  const partnerRef = db.doc(`partners/${partnerPartnerId}`)
  const partnerSnap = await partnerRef.get()
  if (!partnerSnap.exists) throw Errors.notFound('השותף')

  const partner = partnerSnap.data()!
  if (partner.boatId !== boatId) throw Errors.permissionDenied('השותף אינו שייך לסירה זו')
  if (partner.userId !== uid) throw Errors.permissionDenied('לא ניתן להצטרף בשם שותף אחר')

  // Check not already a participant
  const participants = (booking.participants as string[]) ?? []
  if (participants.includes(partnerPartnerId)) {
    throw Errors.alreadyExists('הינך כבר רשום כמשתתף בהזמנה זו')
  }

  // Check financial freeze
  if (partner.financialStatus === 'frozen') {
    throw Errors.frozenPartner()
  }

  // Calculate credit cost
  const creditType = booking.creditType as 'weekday' | 'weekend'
  const settingsDoc = await db.doc(`system_settings/${boatId}_credits`).get()
  const settings = settingsDoc.exists ? settingsDoc.data()! : { dayCreditCost: 1, weekendCreditCost: 2 }

  const rawCreditType = creditType === 'weekday' ? 'day' : 'weekend'
  const creditCost = calculateCreditCost(rawCreditType, settings.dayCreditCost, settings.weekendCreditCost)

  const currentBalance =
    creditType === 'weekday' ? partner.weekdayCreditsBalance : partner.weekendCreditsBalance

  if (currentBalance < creditCost) {
    throw Errors.insufficientCredits()
  }

  await runTransaction(async (transaction) => {
    // Re-check partner balance
    const partnerTransSnap = await transaction.get(partnerRef)
    if (!partnerTransSnap.exists) throw Errors.notFound('השותף')
    const partnerData = partnerTransSnap.data()!

    const balance =
      creditType === 'weekday' ? partnerData.weekdayCreditsBalance : partnerData.weekendCreditsBalance
    if (balance < creditCost) throw Errors.insufficientCredits()

    const balanceField = creditType === 'weekday' ? 'weekdayCreditsBalance' : 'weekendCreditsBalance'
    const newBalance = balance - creditCost

    // Update partner credits
    transaction.update(partnerRef, {
      [balanceField]: FieldValue.increment(-creditCost),
      updatedAt: serverTimestamp(),
    })

    // Add participant to booking
    transaction.update(bookingRef, {
      participants: FieldValue.arrayUnion(partnerPartnerId),
      updatedAt: serverTimestamp(),
    })

    // Create credit transaction
    const creditTxRef = db.collection('credit_transactions').doc()
    transaction.set(creditTxRef, {
      boatId,
      partnerId: partnerPartnerId,
      bookingId,
      type: 'debit',
      creditType,
      amount: creditCost,
      balanceAfter: newBalance,
      description: `הצטרפות לשיט משותף: ${booking.title}`,
      createdByUserId: uid,
      createdAt: serverTimestamp(),
    })
  })

  await writeAuditLog({
    boatId,
    action: 'booking.partner_joined',
    performedByUserId: uid,
    entityType: 'booking',
    entityId: bookingId,
    details: { partnerPartnerId, creditsUsed: creditCost },
  })

  return { success: true }
})
