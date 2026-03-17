export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'
export type SplitMethod = 'equal' | 'custom'

export interface PartnerSplit {
  partnerId: string
  amount: number
}

/**
 * Splits a total charge equally among partners.
 * Handles rounding: remaining cents go to the first partner.
 */
export function splitEqually(totalAmount: number, partnerIds: string[]): PartnerSplit[] {
  if (partnerIds.length === 0) return []

  const base = Math.floor((totalAmount / partnerIds.length) * 100) / 100
  const total = base * partnerIds.length
  const remainder = Math.round((totalAmount - total) * 100) / 100

  return partnerIds.map((partnerId, index) => ({
    partnerId,
    amount: index === 0 ? base + remainder : base,
  }))
}

/**
 * Validates that custom splits sum to the total amount.
 */
export function validateCustomSplits(
  splits: PartnerSplit[],
  totalAmount: number,
): boolean {
  const splitTotal = splits.reduce((sum, s) => sum + s.amount, 0)
  return Math.abs(splitTotal - totalAmount) < 0.01 // floating point tolerance
}

/**
 * Determines invoice status based on due date and payment.
 */
export function determineInvoiceStatus(
  isPaid: boolean,
  dueDate: Date,
): InvoiceStatus {
  if (isPaid) return 'paid'
  if (dueDate < new Date()) return 'overdue'
  return 'pending'
}

/**
 * Calculates total outstanding balance for a partner across all invoices.
 */
export function calculateOutstandingBalance(
  invoices: Array<{ amount: number; status: InvoiceStatus }>,
): number {
  return invoices
    .filter((inv) => inv.status === 'pending' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0)
}
