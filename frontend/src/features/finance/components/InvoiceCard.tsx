import type { PartnerInvoice } from '@/types'

const STATUS_CONFIG: Record<PartnerInvoice['status'], { label: string; classes: string }> = {
  open: { label: 'פתוח', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  partial: { label: 'חלקי', classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  paid: { label: 'שולם', classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  overdue: { label: 'באיחור', classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  frozen: { label: 'מוקפא', classes: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
}

function formatAmount(amount: number): string {
  return `₪${amount.toLocaleString('he-IL')}`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface Props {
  invoice: PartnerInvoice
  partnerName?: string
  onRegisterPayment?: (invoice: PartnerInvoice) => void
}

export default function InvoiceCard({ invoice, partnerName, onRegisterPayment }: Props) {
  const status = STATUS_CONFIG[invoice.status]
  const isPaid = invoice.status === 'paid'
  const progress = invoice.amount > 0 ? (invoice.amountPaid / invoice.amount) * 100 : 0

  return (
    <div className="card p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        {partnerName && (
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{partnerName}</p>
        )}
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.classes}`}>
          {status.label}
        </span>
      </div>

      {/* Amounts */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">סכום</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatAmount(invoice.amount)}
          </p>
        </div>
        {!isPaid && (
          <div className="text-left">
            <p className="text-xs text-gray-500 dark:text-gray-400">נותר לתשלום</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {formatAmount(invoice.amountRemaining)}
            </p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {invoice.amountPaid > 0 && (
        <div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            שולם: {formatAmount(invoice.amountPaid)}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          פירעון: {formatDate(invoice.dueDate)}
        </p>
        {!isPaid && onRegisterPayment && (
          <button
            onClick={() => onRegisterPayment(invoice)}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            רשום תשלום
          </button>
        )}
      </div>
    </div>
  )
}
