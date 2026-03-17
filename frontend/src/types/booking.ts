export type BookingType = 'private_sail' | 'partner_sail' | 'marina_use' | 'maintenance_block'
export type BookingStatus = 'active' | 'cancelled' | 'completed'
export type CreditType = 'weekday' | 'weekend'

export interface Booking {
  id: string
  boatId: string
  createdByUserId: string
  ownerPartnerId: string
  type: BookingType
  status: BookingStatus
  title: string
  notes: string | null
  startTime: Date
  endTime: Date
  durationHours: number
  creditType: CreditType | null
  creditsUsed: number
  participants: string[]
  createdAt: Date
  updatedAt: Date
  cancelledAt: Date | null
  cancelledByUserId: string | null
}
