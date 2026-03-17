export type TicketCategory = 'engine' | 'sails' | 'electrical' | 'hull' | 'safety' | 'general'
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'
export type TicketStatus = 'open' | 'in_progress' | 'waiting_parts' | 'resolved' | 'closed'

export interface MaintenanceTicket {
  id: string
  boatId: string
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  createdByUserId: string
  createdByPartnerId: string | null
  assignedToUserId: string | null
  attachmentCount: number
  createdAt: Date
  updatedAt: Date
  resolvedAt: Date | null
  closedAt: Date | null
}

export interface MaintenanceUpdate {
  id: string
  boatId: string
  ticketId: string
  comment: string
  statusBefore: TicketStatus | null
  statusAfter: TicketStatus | null
  createdByUserId: string
  createdAt: Date
}

export interface MaintenanceAttachment {
  id: string
  boatId: string
  ticketId: string
  storagePath: string
  fileName: string
  contentType: string
  sizeBytes: number
  uploadedByUserId: string
  createdAt: Date
}
