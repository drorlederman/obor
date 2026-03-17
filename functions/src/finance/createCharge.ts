import { onCall } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { ensureRoleIn } from '../shared/auth'
import { Errors } from '../shared/errors'
import { serverTimestamp } from '../shared/firestore'
import { toTimestamp } from '../shared/dates'
import { writeAuditLog } from '../audit/writeAuditLog'

type ChargeCategory = 'maintenance' | 'marina' | 'insurance' | 'equipment' | 'general'

interface CreateChargeData {
  boatId: string
  title: string
  description?: string | null
  category: ChargeCategory
  totalAmount: number
  dueDate: string // ISO string
}

const VALID_CATEGORIES: ChargeCategory[] = ['maintenance', 'marina', 'insurance', 'equipment', 'general']

export const createCharge = onCall(async (request) => {
  const { boatId, title, description = null, category, totalAmount, dueDate } =
    request.data as CreateChargeData

  if (!boatId) throw Errors.invalidArgument('boatId הוא שדה חובה')
  if (!title?.trim()) throw Errors.invalidArgument('כותרת החיוב היא שדה חובה')
  if (!VALID_CATEGORIES.includes(category)) throw Errors.invalidArgument('קטגוריה לא תקינה')
  if (!totalAmount || totalAmount <= 0) throw Errors.invalidArgument('סכום החיוב חייב להיות מספר חיובי')
  if (!dueDate) throw Errors.invalidArgument('תאריך פירעון הוא שדה חובה')

  const { uid } = await ensureRoleIn(request, boatId, ['treasurer', 'admin'])

  const db = getFirestore()
  const chargeRef = db.collection('charges').doc()

  await chargeRef.set({
    boatId,
    title: title.trim(),
    description: description ?? null,
    category,
    totalAmount,
    splitMethod: 'equal',
    dueDate: toTimestamp(dueDate),
    status: 'draft',
    createdByUserId: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await writeAuditLog({
    boatId,
    action: 'charge.created',
    performedByUserId: uid,
    entityType: 'charge',
    entityId: chargeRef.id,
    details: { title: title.trim(), totalAmount, category },
  })

  return { success: true, chargeId: chargeRef.id }
})
