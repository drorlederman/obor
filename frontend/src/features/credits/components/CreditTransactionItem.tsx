import type { CreditTransaction } from '@/hooks/useCreditTransactions'

const TX_CONFIG: Record<
  CreditTransaction['type'],
  { label: string; sign: string; color: string; bgColor: string; icon: string }
> = {
  debit: {
    label: 'שימוש',
    sign: '-',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: '↓',
  },
  credit: {
    label: 'קבלה',
    sign: '+',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: '↑',
  },
  refund: {
    label: 'החזר',
    sign: '+',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: '↩',
  },
  adjustment: {
    label: 'התאמה',
    sign: '+',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: '⚙',
  },
}

const CREDIT_TYPE_LABELS = { weekday: 'יום חול', weekend: 'סוף שבוע' }

function formatDate(d: Date) {
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Props {
  tx: CreditTransaction
}

export default function CreditTransactionItem({ tx }: Props) {
  const cfg = TX_CONFIG[tx.type]

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      {/* Type icon */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${cfg.bgColor}`}
      >
        <span className={cfg.color}>{cfg.icon}</span>
      </div>

      {/* Description + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {tx.description}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {cfg.label} · {CREDIT_TYPE_LABELS[tx.creditType]} · {formatDate(tx.createdAt)}
        </p>
      </div>

      {/* Amount + balance after */}
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${cfg.color}`}>
          {cfg.sign}{tx.amount}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          יתרה: {tx.balanceAfter}
        </p>
      </div>
    </div>
  )
}
