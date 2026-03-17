import { Link } from 'react-router-dom'
import { useFeedbackReports } from '@/hooks/useFeedbackReports'
import { useBoat } from '@/context/BoatContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { FeedbackType, FeedbackStatus } from '@/types'

const TYPE_CONFIG: Record<FeedbackType, { label: string; classes: string }> = {
  bug:     { label: 'תקלה',    classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  feature: { label: 'פיצ׳ר',   classes: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  general: { label: 'כללי',    classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; classes: string }> = {
  new:       { label: 'חדש',      classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  reviewing: { label: 'בבדיקה',   classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  resolved:  { label: 'טופל',     classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  closed:    { label: 'סגור',     classes: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500' },
}

function formatDate(date: Date) {
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function FeedbackPage() {
  const { isAdmin } = useBoat()
  const { data: reports, isLoading, error } = useFeedbackReports()

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">פידבק ודיווח תקלות</h1>
        <Link to="/feedback/new" className="btn-primary text-sm px-4 py-2">
          + דיווח חדש
        </Link>
      </div>

      {isAdmin && (
        <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 py-2 px-4">
          <p className="text-xs text-blue-700 dark:text-blue-300">מנהל — מציג את כל הדיווחים</p>
        </div>
      )}

      {isLoading && <div className="flex justify-center py-12"><LoadingSpinner /></div>}
      {error && <div className="card text-center text-red-500">שגיאה בטעינת הדיווחים</div>}

      {!isLoading && !error && (!reports || reports.length === 0) && (
        <div className="card text-center py-10">
          <p className="text-3xl mb-3">💬</p>
          <p className="font-medium text-gray-700 dark:text-gray-300">אין דיווחים עדיין</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            נתקלת בתקלה או יש לך רעיון? שתף אותנו
          </p>
        </div>
      )}

      {reports && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((r) => {
            const typeCfg = TYPE_CONFIG[r.type]
            const statusCfg = STATUS_CONFIG[r.status]
            return (
              <div key={r.id} className="card space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{r.title}</p>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeCfg.classes}`}>
                      {typeCfg.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.classes}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{r.message}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(r.createdAt)}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
