import { onCall } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { ensureRoleIn } from '../shared/auth'
import { Errors } from '../shared/errors'
import { serverTimestamp } from '../shared/firestore'

interface AddMaintenanceUpdateData {
  ticketId: string
  comment: string
}

export const addMaintenanceUpdate = onCall(async (request) => {
  const { ticketId, comment } = request.data as AddMaintenanceUpdateData

  if (!ticketId) throw Errors.invalidArgument('ticketId הוא שדה חובה')
  if (!comment?.trim()) throw Errors.invalidArgument('תוכן העדכון הוא שדה חובה')

  const db = getFirestore()
  const ticketRef = db.doc(`maintenance_tickets/${ticketId}`)

  const ticketSnap = await ticketRef.get()
  if (!ticketSnap.exists) throw Errors.notFound('קריאת התחזוקה')

  const ticket = ticketSnap.data()!
  const boatId = ticket.boatId as string

  const { uid } = await ensureRoleIn(request, boatId, ['maintenanceManager', 'admin'])

  if (ticket.status === 'closed') {
    throw Errors.preconditionFailed('לא ניתן להוסיף עדכון לקריאה סגורה')
  }

  const now = serverTimestamp()

  const batch = db.batch()

  const updateRef = db.collection('maintenance_updates').doc()
  batch.set(updateRef, {
    boatId,
    ticketId,
    comment: comment.trim(),
    statusBefore: null,
    statusAfter: null,
    createdByUserId: uid,
    createdAt: now,
  })

  batch.update(ticketRef, {
    updatedAt: now,
  })

  await batch.commit()

  return { success: true, updateId: updateRef.id }
})
