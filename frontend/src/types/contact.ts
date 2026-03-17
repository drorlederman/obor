export type ContactCategory = 'marina' | 'emergency' | 'supplier' | 'service' | 'general'

export interface Contact {
  id: string
  boatId: string
  name: string
  roleLabel: string
  phone: string
  email: string | null
  notes: string | null
  category: ContactCategory
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
