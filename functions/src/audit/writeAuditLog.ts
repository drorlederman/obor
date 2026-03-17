import { getFirestore, FieldValue } from 'firebase-admin/firestore'

export type AuditAction =
  // Boats
  | 'boat.created'
  | 'boat.updated'
  // Members
  | 'member.invited'
  | 'member.joined'
  | 'member.removed'
  | 'member.role_changed'
  | 'member.frozen'
  | 'member.unfrozen'
  // Bookings
  | 'booking.created'
  | 'booking.cancelled'
  | 'booking.partner_joined'
  // Credits
  | 'credit.adjusted'
  | 'credit.deducted'
  | 'credit.refunded'
  // Finance
  | 'charge.created'
  | 'charge.published'
  | 'invoice.created'
  | 'invoice.marked_overdue'
  | 'payment.registered'
  // Maintenance
  | 'maintenance.created'
  | 'maintenance.status_changed'
  | 'maintenance.closed'
  // System
  | 'backup.created'
  | 'backup.restored'
  | 'invitation.revoked'

export interface AuditLogPayload {
  boatId: string
  action: AuditAction
  performedByUserId: string
  entityType: string
  entityId: string
  details?: Record<string, unknown>
}

/**
 * Writes an audit log entry. Called by Cloud Functions after critical operations.
 * Only Cloud Functions can write to audit_logs (enforced by Security Rules).
 */
export async function writeAuditLog(payload: AuditLogPayload): Promise<void> {
  const db = getFirestore()

  await db.collection('audit_logs').add({
    ...payload,
    createdAt: FieldValue.serverTimestamp(),
  })
}
