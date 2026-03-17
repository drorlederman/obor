import { onCall } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { ensureRoleIn } from '../shared/auth'
import { Errors } from '../shared/errors'
import { serverTimestamp, runTransaction } from '../shared/firestore'
import { toTimestamp } from '../shared/dates'
import { writeAuditLog } from '../audit/writeAuditLog'

type PaymentMethod = 'cash' | 'bank_transfer' | 'card'

interface RegisterPaymentData {
  invoiceId: string
  amount: number
  method: PaymentMethod
  reference?: string | null
  notes?: string | null
  paidAt: string // ISO string
}

const VALID_METHODS: PaymentMethod[] = ['cash', 'bank_transfer', 'card']

export const registerPayment = onCall(async (request) => {
  const { invoiceId, amount, method, reference = null, notes = null, paidAt } =
    request.data as RegisterPaymentData

  if (!invoiceId) throw Errors.invalidArgument('invoiceId הוא שדה חובה')
  if (!amount || amount <= 0) throw Errors.invalidArgument('סכום התשלום חייב להיות מספר חיובי')
  if (!VALID_METHODS.includes(method)) throw Errors.invalidArgument('אמצעי תשלום לא תקין')
  if (!paidAt) throw Errors.invalidArgument('תאריך תשלום הוא שדה חובה')

  const db = getFirestore()
  const invoiceRef = db.doc(`partner_invoices/${invoiceId}`)

  const invoiceSnap = await invoiceRef.get()
  if (!invoiceSnap.exists) throw Errors.notFound('החשבונית')

  const invoice = invoiceSnap.data()!
  const boatId = invoice.boatId as string

  const { uid } = await ensureRoleIn(request, boatId, ['treasurer', 'admin'])

  if (invoice.status === 'paid') {
    throw Errors.preconditionFailed('החשבונית כבר שולמה במלואה')
  }

  const amountRemaining = invoice.amountRemaining as number
  if (amount > amountRemaining) {
    throw Errors.invalidArgument(`סכום התשלום (${amount}) גדול מהיתרה לתשלום (${amountRemaining})`)
  }

  const paymentRef = db.collection('payments').doc()

  await runTransaction(async (transaction) => {
    // Re-read invoice inside transaction
    const invoiceTransSnap = await transaction.get(invoiceRef)
    if (!invoiceTransSnap.exists) throw Errors.notFound('החשבונית')

    const invoiceData = invoiceTransSnap.data()!
    if (invoiceData.status === 'paid') {
      throw Errors.preconditionFailed('החשבונית כבר שולמה במלואה')
    }

    const currentAmountPaid = invoiceData.amountPaid as number
    const currentAmountRemaining = invoiceData.amountRemaining as number

    const newAmountPaid = currentAmountPaid + amount
    const newAmountRemaining = currentAmountRemaining - amount
    const newStatus = newAmountRemaining <= 0 ? 'paid' : 'partial'

    // Create payment record
    transaction.set(paymentRef, {
      boatId,
      invoiceId,
      partnerId: invoice.partnerId,
      amount,
      method,
      reference: reference ?? null,
      notes: notes ?? null,
      paidAt: toTimestamp(paidAt),
      createdByUserId: uid,
      createdAt: serverTimestamp(),
    })

    // Update invoice
    transaction.update(invoiceRef, {
      amountPaid: newAmountPaid,
      amountRemaining: Math.max(0, newAmountRemaining),
      status: newStatus,
      lastPaymentAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })

  await writeAuditLog({
    boatId,
    action: 'payment.registered',
    performedByUserId: uid,
    entityType: 'payment',
    entityId: paymentRef.id,
    details: { invoiceId, amount, method, partnerId: invoice.partnerId },
  })

  return { success: true, paymentId: paymentRef.id }
})
