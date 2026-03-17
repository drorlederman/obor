export type AnnouncementPriority = 'info' | 'important' | 'urgent'

export interface Announcement {
  id: string
  boatId: string
  title: string
  content: string
  priority: AnnouncementPriority
  isActive: boolean
  expiresAt: Date | null
  createdByUserId: string
  createdAt: Date
  updatedAt: Date
}
