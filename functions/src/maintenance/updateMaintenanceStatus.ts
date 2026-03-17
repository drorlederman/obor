import { onCall } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { ensureRoleIn } from '../shared/auth'
import { Errors } from '../shared/errors'
import { serverTimestamp } from '../shared/firestore'
import { writeAuditLog } from '../audit/writeAuditLog'

type TicketStatus = 'open' | 'in_progress' | 'waiting_parts' | 'resolved' | 'closed'

interface UpdateMaintenanceStatusData {
  ticketId: string
  status: TicketStatus
  comment?: string | null
}

const VALID_STATUSES: TicketStatus[] = ['open', 'in_progress', 'waiting_parts', 'resolved', 'closed']

export const updateMaintenanceStatus = onCall(async (request) => {
  const { ticketId, status: newStatus, comment = null } =
    request.data as UpdateMaintenanceStatusData

  if (!ticketId) throw Errors.invalidArgument('ticketId הוא שדה חובה')
  if (!VALID_STATUSES.includes(newStatus)) throw Errors.invalidArgument('סטטוס לא תקין')

  const db = getFirestore()
  const ticketRef = db.doc(`maintenance_tickets/${ticketId}`)

  const ticketSnap = await ticketRef.get()
  if (!ticketSnap.exists) throw Errors.notFound('קריאת התחזוקה')

  const ticket = ticketSnap.data()!
  const boatId = ticket.boatId as string

  const { uid } = await ensureRoleIn(request, boatId, ['maintenanceManager', 'admin'])

  const statusBefore = ticket.status as TicketStatus

  if (statusBefore === newStatus) {
    throw Errors.preconditionFailed('הסטטוס החדש זהה לסטטוס הנוכחי')
  }
  if (statusBefore === 'closed') {
    throw Errors.preconditionFailed('לא ניתן לשנות סטטוס של קריאה סגורה')
  }

  const now = serverTimestamp()
  const ticketUpdate: Record<string, unknown> = {
    status: newStatus,
    updatedAt: now,
  }

  if (newStatus === 'resolved') ticketUpdate.resolvedAt = now
  if (newStatus === 'closed') {
    ticketUpdate.closedAt = now
    if (!ticketUpdate.resolvedAt && !ticket.resolvedAt) {
      ticketUpdate.resolvedAt = now
    }
  }

  const batch = db.batch()

  // Update ticket
  batch.update(ticketRef, ticketUpdate)

  // Create maintenance update
  const updateRef = db.collection('maintenance_updates').doc()
  batch.set(updateRef, {
    boatId,
    ticketId,
    comment: comment ?? `שינוי סטטוס: ${statusBefore} → ${newStatus}`,
    statusBefore,
    statusAfter: newStatus,
    createdByUserId: uid,
    createdAt: now,
  })

  await batch.commit()

  const auditAction = newStatus === 'closed' ? 'maintenance.closed' : 'maintenance.status_changed'

  await writeAuditLog({
    boatId,
    action: auditAction,
    performedByUserId: uid,
    entityType: 'maintenance_ticket',
    entityId: ticketId,
    details: { statusBefore, statusAfter: newStatus },
  })

  return { success: true, updateId: updateRef.id }
})
