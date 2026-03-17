import { Link } from 'react-router-dom'
import { useAllPartners } from '@/hooks/useAllPartners'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { FinancialStatus } from '@/types'

const FINANCIAL_STATUS: Record<FinancialStatus, { label: string; classes: string }> = {
  active:  { label: 'תקין',   classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  overdue: { label: 'חוב',    classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  frozen:  { label: 'מוקפא',  classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

export default function PartnersPage() {
  const { data: partners, isLoading, error } = useAllPartners()

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">ניהול שותפים</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {partners?.length ?? 0} שותפים
        </span>
      </div>

      {isLoading && <div className="flex justify-center py-12"><LoadingSpinner /></div>}
      {error && <div className="card text-center text-red-500">שגיאה בטעינת השותפים</div>}

      {!isLoading && !error && (!partners || partners.length === 0) && (
        <div className="card text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">אין שותפים פעילים</p>
        </div>
      )}

      {partners && partners.length > 0 && (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800 p-0 overflow-hidden">
          {partners.map((p) => {
            const fin = FINANCIAL_STATUS[p.financialStatus]
            const totalCredits = p.weekdayCreditsBalance + p.weekendCreditsBalance
            return (
              <Link
                key={p.id}
                to={`/partners/${p.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{p.fullName}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${fin.classes}`}>
                      {fin.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{p.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{totalCredits}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">מטבעות</p>
                  </div>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-gray-400 rotate-180">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Summary stats */}
      {partners && partners.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center py-3">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {partners.filter((p) => p.financialStatus === 'active').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">תקינים</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {partners.filter((p) => p.financialStatus === 'overdue').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">בחוב</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-lg font-bold text-gray-600 dark:text-gray-400">
              {partners.filter((p) => p.financialStatus === 'frozen').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">מוקפאים</p>
          </div>
        </div>
      )}
    </div>
  )
}
