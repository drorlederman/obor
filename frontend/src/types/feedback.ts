export type FeedbackType = 'bug' | 'feature' | 'general'
export type FeedbackStatus = 'new' | 'reviewing' | 'resolved' | 'closed'

export interface FeedbackReport {
  id: string
  boatId: string
  userId: string
  partnerId: string | null
  type: FeedbackType
  title: string
  message: string
  status: FeedbackStatus
  attachmentCount: number
  createdAt: Date
  updatedAt: Date
}

export interface FeedbackAttachment {
  id: string
  boatId: string
  reportId: string
  storagePath: string
  fileName: string
  contentType: string
  sizeBytes: number
  uploadedByUserId: string
  createdAt: Date
}
