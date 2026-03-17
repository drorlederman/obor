import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMaintenanceTickets } from '@/hooks/useMaintenanceTickets'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { TicketStatus } from '@/types'

const STATUS_CONFIG: Record<TicketStatus, { label: string; classes: string }> = {
  open:          { label: 'פתוח',         classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  in_progress:   { label: 'בטיפול',       classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  waiting_parts: { label: 'ממתין לחלקים', classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  resolved:      { label: 'טופל',         classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  closed:        { label: 'סגור',         classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-gray-400', medium: 'bg-yellow-400', high: 'bg-orange-400', critical: 'bg-red-500',
}

const STATUS_TABS: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all',           label: 'הכל' },
  { value: 'open',          label: 'פתוח' },
  { value: 'in_progress',   label: 'בטיפול' },
  { value: 'waiting_parts', label: 'ממתין' },
  { value: 'resolved',      label: 'טופל' },
]

function formatDate(date: Date) {
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
}

export default function MaintenancePage() {
  const { data: tickets, isLoading, error } = useMaintenanceTickets()
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | 'all'>('all')

  const filtered =
    selectedStatus === 'all'
      ? (tickets ?? []).filter((t) => t.status !== 'closed')
      : (tickets ?? []).filter((t) => t.status === selectedStatus)

  const openCount = tickets?.filter((t) => t.status === 'open').length ?? 0
  const criticalCount = tickets?.filter((t) => t.priority === 'critical' && t.status !== 'closed').length ?? 0

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">תחזוקה</h1>
          {(openCount > 0 || criticalCount > 0) && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {openCount > 0 && <span>{openCount} פתוחות</span>}
              {openCount > 0 && criticalCount > 0 && <span className="mx-1">·</span>}
              {criticalCount > 0 && <span className="text-red-500">{criticalCount} קריטיות</span>}
            </p>
          )}
        </div>
        <Link to="/maintenance/new" className="btn-primary text-sm px-4 py-2">
          + קריאה חדשה
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedStatus(tab.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedStatus === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      )}

      {error && (
        <div className="card text-center text-red-500">שגיאה בטעינת קריאות התחזוקה</div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">אין קריאות תחזוקה</p>
          <Link to="/maintenance/new" className="mt-3 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline">
            פתח קריאה ראשונה
          </Link>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((ticket) => (
            <Link
              key={ticket.id}
              to={`/maintenance/${ticket.id}`}
              className="card flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[ticket.priority]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{ticket.title}</p>
                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CONFIG[ticket.status].classes}`}>
                    {STATUS_CONFIG[ticket.status].label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{ticket.description}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(ticket.createdAt)}</p>
              </div>
              <span className="text-gray-300 dark:text-gray-600 text-lg">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
