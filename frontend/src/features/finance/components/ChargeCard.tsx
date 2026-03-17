import type { Charge } from '@/types'

const CATEGORY_LABELS: Record<Charge['category'], string> = {
  maintenance: 'תחזוקה',
  marina: 'מרינה',
  insurance: 'ביטוח',
  equipment: 'ציוד',
  general: 'כללי',
}

const STATUS_CONFIG: Record<Charge['status'], { label: string; classes: string }> = {
  draft: { label: 'טיוטה', classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  published: { label: 'פורסם', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  closed: { label: 'סגור', classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
}

function formatAmount(amount: number): string {
  return `₪${amount.toLocaleString('he-IL')}`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface Props {
  charge: Charge
  onPublish?: (chargeId: string) => void
  publishing?: boolean
}

export default function ChargeCard({ charge, onPublish, publishing }: Props) {
  const status = STATUS_CONFIG[charge.status]

  return (
    <div className="card p-4 space-y-3">
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white truncate">{charge.title}</p>
          {charge.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
              {charge.description}
            </p>
          )}
        </div>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${status.classes}`}>
          {status.label}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">
          {CATEGORY_LABELS[charge.category]}
        </span>
        <span>·</span>
        <span>פירעון: {formatDate(charge.dueDate)}</span>
      </div>

      {/* Amount + action */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {formatAmount(charge.totalAmount)}
        </p>
        {charge.status === 'draft' && onPublish && (
          <button
            onClick={() => onPublish(charge.id)}
            disabled={publishing}
            className="btn-primary text-sm px-4 py-1.5"
          >
            {publishing ? 'מפרסם...' : 'פרסם'}
          </button>
        )}
      </div>
    </div>
  )
}
