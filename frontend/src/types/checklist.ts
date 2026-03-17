export type ChecklistType = 'pre_sail' | 'post_sail' | 'maintenance'

export interface ChecklistItem {
  id: string
  text: string
  required: boolean
  sortOrder: number
}

export interface Checklist {
  id: string
  boatId: string
  type: ChecklistType
  title: string
  items: ChecklistItem[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ChecklistResponse {
  itemId: string
  checked: boolean
  note: string | null
}

export interface ChecklistRun {
  id: string
  boatId: string
  checklistId: string
  bookingId: string | null
  completedByUserId: string
  responses: ChecklistResponse[]
  completedAt: Date
}
