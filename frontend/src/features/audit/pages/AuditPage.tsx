import { useState } from 'react'
import { useAuditLogs } from '@/hooks/useAuditLogs'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'

const ACTION_LABELS: Record<string, string> = {
  'boat.created': 'סירה נוצרה',
  'boat.updated': 'פרטי הסירה עודכנו',
  'member.invited': 'שותף הוזמן',
  'member.joined': 'שותף הצטרף',
  'member.removed': 'שותף הוסר',
  'member.role_changed': 'תפקיד שותף שונה',
  'member.frozen': 'שותף הוקפא',
  'member.unfrozen': 'שותף שוחרר',
  'booking.created': 'הזמנה נוצרה',
  'booking.cancelled': 'הזמנה בוטלה',
  'booking.partner_joined': 'שותף הצטרף לשיט',
  'credit.adjusted': 'יתרת מטבעות עודכנה',
  'credit.deducted': 'מטבעות הופחתו',
  'credit.refunded': 'מטבעות הוחזרו',
  'charge.created': 'חיוב נוצר',
  'charge.published': 'חיוב פורסם',
  'invoice.created': 'חשבונית נוצרה',
  'invoice.marked_overdue': 'חשבונית סומנה כפיגור',
  'payment.registered': 'תשלום נרשם',
  'maintenance.created': 'קריאת תחזוקה נוצרה',
  'maintenance.status_changed': 'סטטוס תחזוקה עודכן',
  'maintenance.closed': 'קריאת תחזוקה נסגרה',
  'backup.created': 'גיבוי נוצר',
  'backup.restored': 'גיבוי שוחזר',
  'invitation.revoked': 'הזמנה בוטלה',
}

const ENTITY_LABELS: Record<string, string> = {
  booking: 'הזמנה', charge: 'חיוב', invoice: 'חשבונית',
  payment: 'תשלום', partner: 'שותף', maintenance: 'תחזוקה',
  backup: 'גיבוי', credits: 'מטבעות',
}

function formatDateTime(date: Date) {
  return date.toLocaleString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatActionLabel(action: string) {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action]
  return 'פעולת מערכת'
}

export default function AuditPage() {
  const { data: logs, isLoading, error } = useAuditLogs()
  const [filter, setFilter] = useState<string>('all')

  const entityTypes = [...new Set(logs?.map((l) => l.entityType) ?? [])]

  const filtered = filter === 'all' ? logs : logs?.filter((l) => l.entityType === filter)

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">יומן ביקורת</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">{filtered?.length ?? 0} רשומות</span>
      </div>

      {/* Filter */}
      {entityTypes.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setFilter('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            הכל
          </button>
          {entityTypes.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {ENTITY_LABELS[t] ?? t}
            </button>
          ))}
        </div>
      )}

      {isLoading && <div className="flex justify-center py-12"><LoadingSpinner /></div>}
      {error && (
        <div className="card">
          <ErrorState message="שגיאה בטעינת יומן הביקורת" />
        </div>
      )}

      {!isLoading && !error && (!filtered || filtered.length === 0) && (
        <div className="card">
          <EmptyState
            title="אין רשומות ביומן"
            description="פעולות מערכת יופיעו כאן לאחר ביצוען"
          />
        </div>
      )}

      {filtered && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((log) => (
            <div key={log.id} className="card space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {formatActionLabel(log.action)}
                </p>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                  {formatDateTime(log.createdAt)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                  {ENTITY_LABELS[log.entityType] ?? log.entityType}
                </span>
                {log.performedByRole && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    תפקיד: {log.performedByRole}
                  </span>
                )}
              </div>
              {Object.keys(log.details).length > 0 && (
                <details className="text-xs text-gray-500 dark:text-gray-400">
                  <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">פרטים</summary>
                  <pre className="mt-1 whitespace-pre-wrap break-all text-xs bg-gray-50 dark:bg-gray-900 rounded p-2">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
