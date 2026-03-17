import { onCall } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { ensureAdmin } from '../shared/auth'
import { Errors } from '../shared/errors'
import { serverTimestamp } from '../shared/firestore'
import { writeAuditLog } from '../audit/writeAuditLog'

interface AdjustCreditsData {
  boatId: string
  partnerId: string
  creditType: 'weekday' | 'weekend'
  operation: 'add' | 'subtract'
  amount: number
  description: string
}

export const adjustCredits = onCall(async (request) => {
  const { boatId, partnerId, creditType, operation, amount, description } =
    request.data as AdjustCreditsData

  if (!boatId) throw Errors.invalidArgument('boatId הוא שדה חובה')
  if (!partnerId) throw Errors.invalidArgument('partnerId הוא שדה חובה')
  if (!creditType || !['weekday', 'weekend'].includes(creditType)) {
    throw Errors.invalidArgument('סוג מטבע לא תקין')
  }
  if (!operation || !['add', 'subtract'].includes(operation)) {
    throw Errors.invalidArgument('פעולה לא תקינה')
  }
  if (!amount || amount <= 0) {
    throw Errors.invalidArgument('הכמות חייבת להיות מספר חיובי')
  }
  if (!description?.trim()) {
    throw Errors.invalidArgument('תיאור הוא שדה חובה')
  }

  const { uid } = await ensureAdmin(request, boatId)

  const db = getFirestore()
  const partnerRef = db.doc(`partners/${partnerId}`)
  const partnerSnap = await partnerRef.get()

  if (!partnerSnap.exists) throw Errors.notFound('השותף')
  const partner = partnerSnap.data()!
  if (partner.boatId !== boatId) throw Errors.permissionDenied('השותף אינו שייך לסירה זו')

  const balanceField = creditType === 'weekday' ? 'weekdayCreditsBalance' : 'weekendCreditsBalance'
  const currentBalance =
    creditType === 'weekday' ? partner.weekdayCreditsBalance : partner.weekendCreditsBalance

  if (operation === 'subtract' && currentBalance < amount) {
    throw Errors.preconditionFailed('אין מספיק מטבעות לביצוע הפחתה זו')
  }

  const delta = operation === 'add' ? amount : -amount
  const newBalance = currentBalance + delta
  const txType = operation === 'add' ? 'credit' : 'debit'

  // Update partner balance
  await partnerRef.update({
    [balanceField]: FieldValue.increment(delta),
    updatedAt: serverTimestamp(),
  })

  // Create credit transaction
  const creditTxRef = db.collection('credit_transactions').doc()
  await creditTxRef.set({
    boatId,
    partnerId,
    bookingId: null,
    type: txType,
    creditType,
    amount,
    balanceAfter: newBalance,
    description: description.trim(),
    createdByUserId: uid,
    createdAt: serverTimestamp(),
  })

  await writeAuditLog({
    boatId,
    action: 'credit.adjusted',
    performedByUserId: uid,
    entityType: 'partner',
    entityId: partnerId,
    details: { creditType, operation, amount, newBalance },
  })

  return { success: true, newBalance }
})
