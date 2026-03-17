import { onCall } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { ensureActiveMemberOf, ensureRoleIn } from '../shared/auth'
import { Errors } from '../shared/errors'
import { serverTimestamp, runTransaction } from '../shared/firestore'
import { toDate, toTimestamp } from '../shared/dates'
import {
  assertNoOverlap,
  determineCreditType,
  calculateCreditCost,
} from '../shared/booking-utils'
import { writeAuditLog } from '../audit/writeAuditLog'
import { sendPushToBoatMembers } from '../shared/notifications'

interface CreateBookingData {
  boatId: string
  ownerPartnerId: string
  type: 'private_sail' | 'partner_sail' | 'marina_use' | 'maintenance_block'
  title: string
  notes?: string | null
  startTime: string // ISO string
  endTime: string // ISO string
}

export const createBooking = onCall(async (request) => {
  const { boatId, ownerPartnerId, type, title, notes = null, startTime: startStr, endTime: endStr } =
    request.data as CreateBookingData

  if (!boatId) throw Errors.invalidArgument('boatId הוא שדה חובה')
  if (!ownerPartnerId) throw Errors.invalidArgument('ownerPartnerId הוא שדה חובה')
  if (!type) throw Errors.invalidArgument('סוג הזמנה הוא שדה חובה')
  if (!title?.trim()) throw Errors.invalidArgument('כותרת ההזמנה היא שדה חובה')
  if (!startStr || !endStr) throw Errors.invalidArgument('תאריך התחלה וסיום הם שדות חובה')

  const startTime = toDate(startStr)
  const endTime = toDate(endStr)

  if (endTime <= startTime) {
    throw Errors.invalidArgument('תאריך הסיום חייב להיות אחרי תאריך ההתחלה')
  }

  // Maintenance blocks require scheduler or admin
  if (type === 'maintenance_block') {
    await ensureRoleIn(request, boatId, ['scheduler', 'admin'])
  } else {
    await ensureActiveMemberOf(request, boatId)
  }

  const { uid } = await ensureActiveMemberOf(request, boatId)

  const db = getFirestore()

  // Load partner to verify ownership and check financial status
  const partnerRef = db.doc(`partners/${ownerPartnerId}`)
  const partnerSnap = await partnerRef.get()
  if (!partnerSnap.exists) throw Errors.notFound('השותף')

  const partner = partnerSnap.data()!
  if (partner.boatId !== boatId) throw Errors.permissionDenied('השותף אינו שייך לסירה זו')

  // Non-maintenance bookings: check financial freeze and credits
  let creditType: 'weekday' | 'weekend' | null = null
  let creditCost = 0

  if (type !== 'maintenance_block') {
    if (partner.financialStatus === 'frozen') {
      throw Errors.frozenPartner()
    }

    // Load credits settings
    const settingsDoc = await db.doc(`system_settings/${boatId}_credits`).get()
    const settings = settingsDoc.exists ? settingsDoc.data()! : { dayCreditCost: 1, weekendCreditCost: 2 }

    const rawCreditType = determineCreditType(startTime, endTime)
    creditType = rawCreditType === 'day' ? 'weekday' : 'weekend'
    creditCost = calculateCreditCost(rawCreditType, settings.dayCreditCost, settings.weekendCreditCost)

    const currentBalance =
      creditType === 'weekday' ? partner.weekdayCreditsBalance : partner.weekendCreditsBalance

    if (currentBalance < creditCost) {
      throw Errors.insufficientCredits()
    }
  }

  // Pre-check for overlaps (outside transaction)
  await assertNoOverlap(boatId, startTime, endTime)

  const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)

  // Atomic booking creation + credit debit
  const bookingRef = db.collection('bookings').doc()
  const bookingId = bookingRef.id

  await runTransaction(async (transaction) => {
    // Re-check partner inside transaction
    const partnerTransSnap = await transaction.get(partnerRef)
    if (!partnerTransSnap.exists) throw Errors.notFound('השותף')

    const partnerData = partnerTransSnap.data()!

    if (type !== 'maintenance_block') {
      const balance =
        creditType === 'weekday' ? partnerData.weekdayCreditsBalance : partnerData.weekendCreditsBalance
      if (balance < creditCost) throw Errors.insufficientCredits()

      // Debit credits
      const balanceField = creditType === 'weekday' ? 'weekdayCreditsBalance' : 'weekendCreditsBalance'
      const newBalance = balance - creditCost

      transaction.update(partnerRef, {
        [balanceField]: FieldValue.increment(-creditCost),
        updatedAt: serverTimestamp(),
      })

      // Create credit transaction
      const creditTxRef = db.collection('credit_transactions').doc()
      transaction.set(creditTxRef, {
        boatId,
        partnerId: ownerPartnerId,
        bookingId,
        type: 'debit',
        creditType,
        amount: creditCost,
        balanceAfter: newBalance,
        description: `הזמנה: ${title.trim()}`,
        createdByUserId: uid,
        createdAt: serverTimestamp(),
      })
    }

    // Create booking
    transaction.set(bookingRef, {
      boatId,
      createdByUserId: uid,
      ownerPartnerId,
      type,
      status: 'active',
      title: title.trim(),
      notes,
      startTime: toTimestamp(startTime),
      endTime: toTimestamp(endTime),
      durationHours,
      creditType,
      creditsUsed: creditCost,
      participants: type === 'partner_sail' ? [ownerPartnerId] : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      cancelledAt: null,
      cancelledByUserId: null,
    })
  })

  await writeAuditLog({
    boatId,
    action: 'booking.created',
    performedByUserId: uid,
    entityType: 'booking',
    entityId: bookingId,
    details: { type, title: title.trim(), startTime: startStr, endTime: endStr, creditsUsed: creditCost },
  })

  // Notify all boat members (non-blocking)
  sendPushToBoatMembers(
    boatId,
    {
      title: 'הזמנה חדשה',
      body: `${title.trim()} — ${new Date(startStr).toLocaleDateString('he-IL')}`,
      data: { type: 'booking_created', boatId, bookingId },
    },
    uid,
  ).catch((err) => console.error('sendPushToBoatMembers failed:', err))

  return { success: true, bookingId }
})
