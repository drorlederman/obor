import type { Payment } from '@/types'

const METHOD_LABELS: Record<Payment['method'], string> = {
  cash: 'מזומן',
  bank_transfer: 'העברה בנקאית',
  card: 'כרטיס אשראי',
}

function formatAmount(amount: number): string {
  return `₪${amount.toLocaleString('he-IL')}`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Props {
  payment: Payment
  partnerName?: string
}

export default function PaymentItem({ payment, partnerName }: Props) {
  return (
    <div className="flex items-center gap-3 py-3">
      {/* Icon */}
      <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
        <span className="text-green-600 dark:text-green-400 text-base">₪</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {partnerName ?? 'תשלום'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {METHOD_LABELS[payment.method]}
          {payment.reference ? ` · ${payment.reference}` : ''}
        </p>
      </div>

      {/* Amount + date */}
      <div className="text-left shrink-0">
        <p className="text-sm font-bold text-green-600 dark:text-green-400">
          {formatAmount(payment.amount)}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(payment.paidAt)}</p>
      </div>
    </div>
  )
}
