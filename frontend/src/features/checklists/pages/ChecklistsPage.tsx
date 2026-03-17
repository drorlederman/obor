import { Link } from 'react-router-dom'
import { useChecklists } from '@/hooks/useChecklists'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { ChecklistType, Checklist } from '@/types'

const TYPE_CONFIG: Record<ChecklistType, { label: string; icon: string; desc: string }> = {
  pre_sail:    { label: 'לפני יציאה',   icon: '⛵', desc: 'בדיקות לפני כל הפלגה' },
  post_sail:   { label: 'אחרי יציאה',  icon: '🏠', desc: 'סיכום וסגירה לאחר הפלגה' },
  maintenance: { label: 'תחזוקה',      icon: '🔧', desc: 'בדיקות תחזוקה תקופתיות' },
}

export default function ChecklistsPage() {
  const { data: checklists, isLoading, error } = useChecklists()

  const grouped = checklists?.reduce<Partial<Record<ChecklistType, Checklist[]>>>((acc, c) => {
    const key = c.type
    if (!acc[key]) acc[key] = []
    acc[key]!.push(c)
    return acc
  }, {}) ?? {}

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white pt-2">צ׳קליסטים</h1>

      {isLoading && <div className="flex justify-center py-12"><LoadingSpinner /></div>}
      {error && (
        <div className="card">
          <ErrorState message="שגיאה בטעינת הצ׳קליסטים" />
        </div>
      )}

      {!isLoading && !error && checklists?.length === 0 && (
        <div className="card">
          <EmptyState
            title="אין צ׳קליסטים פעילים"
            description="המנהל יוסיף צ׳קליסטים לסירה"
          />
        </div>
      )}

      {(['pre_sail', 'post_sail', 'maintenance'] as ChecklistType[]).map((type) => {
        const items = grouped[type]
        if (!items?.length) return null
        const cfg = TYPE_CONFIG[type]
        return (
          <div key={type}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{cfg.icon}</span>
              <div>
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{cfg.label}</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">{cfg.desc}</p>
              </div>
            </div>
            <div className="card divide-y divide-gray-100 dark:divide-gray-800 p-0 overflow-hidden">
              {items.map((cl) => (
                <Link
                  key={cl.id}
                  to={`/checklists/${cl.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{cl.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cl.items.length} סעיפים</p>
                  </div>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-gray-400 flex-shrink-0 rotate-180">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
