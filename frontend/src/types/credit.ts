import type { CreditType } from './booking'

export type CreditTransactionType = 'debit' | 'credit' | 'refund' | 'adjustment'

export interface CreditTransaction {
  id: string
  boatId: string
  partnerId: string
  bookingId: string | null
  type: CreditTransactionType
  creditType: CreditType
  amount: number
  balanceAfter: number
  description: string
  createdByUserId: string
  createdAt: Date
}
