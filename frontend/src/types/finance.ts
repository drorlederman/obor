export type ChargeCategory = 'maintenance' | 'marina' | 'insurance' | 'equipment' | 'general'
export type ChargeStatus = 'draft' | 'published' | 'closed'
export type InvoiceStatus = 'open' | 'partial' | 'paid' | 'overdue' | 'frozen'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card'

export interface Charge {
  id: string
  boatId: string
  title: string
  description: string | null
  category: ChargeCategory
  totalAmount: number
  splitMethod: 'equal'
  dueDate: Date
  status: ChargeStatus
  createdByUserId: string
  createdAt: Date
  updatedAt: Date
}

export interface PartnerInvoice {
  id: string
  boatId: string
  chargeId: string
  partnerId: string
  amount: number
  amountPaid: number
  amountRemaining: number
  status: InvoiceStatus
  dueDate: Date
  createdAt: Date
  updatedAt: Date
  lastPaymentAt: Date | null
}

export interface Payment {
  id: string
  boatId: string
  invoiceId: string
  partnerId: string
  amount: number
  method: PaymentMethod
  reference: string | null
  notes: string | null
  paidAt: Date
  createdByUserId: string
  createdAt: Date
}
