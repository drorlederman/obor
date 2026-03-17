export interface AuditLog {
  id: string
  boatId: string
  action: string
  entityType: string
  entityId: string
  performedByUserId: string
  performedByRole: string | null
  targetPartnerId: string | null
  details: Record<string, unknown>
  createdAt: Date
}
