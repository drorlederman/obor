export type MemberRole = 'partner' | 'scheduler' | 'treasurer' | 'maintenanceManager' | 'admin'
export type PartnerStatus = 'active' | 'frozen' | 'removed'
export type FinancialStatus = 'active' | 'overdue' | 'frozen'

export interface Partner {
  id: string
  boatId: string
  userId: string | null
  fullName: string
  email: string
  phone: string | null
  status: PartnerStatus
  weekdayCreditsBalance: number
  weekendCreditsBalance: number
  financialStatus: FinancialStatus
  joinedAt: Date
  notes: string | null
}
