import { Link } from 'react-router-dom'
import { useBoat } from '@/context/BoatContext'
import { useInvoices } from '@/hooks/useInvoices'
import { useCharges } from '@/hooks/useCharges'

function formatAmount(amount: number): string {
  return `₪${amount.toLocaleString('he-IL')}`
}

export default function FinancePage() {
  const { isTreasurer, isAdmin } = useBoat()
  const canManage = isTreasurer || isAdmin

  const { data: invoices } = useInvoices()
  const { data: charges } = useCharges()

  const openInvoices = invoices?.filter((inv) => inv.status === 'open' || inv.status === 'partial') ?? []
  const overdueInvoices = invoices?.filter((inv) => inv.status === 'overdue') ?? []
  const totalRemaining = openInvoices.reduce((sum, inv) => sum + inv.amountRemaining, 0)
  const draftCharges = charges?.filter((c) => c.status === 'draft') ?? []

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">פיננסים</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">יתרה לגבייה</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatAmount(totalRemaining)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">חשבוניות פתוחות</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{openInvoices.length}</p>
        </div>
        {overdueInvoices.length > 0 && (
          <div className="card text-center col-span-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">חשבוניות באיחור</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{overdueInvoices.length}</p>
          </div>
        )}
      </div>

      {/* Navigation cards */}
      <div className="space-y-3">
        <Link
          to="/finance/invoices"
          className="card flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">חשבוניות</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {canManage ? 'כל חשבוניות השותפים' : 'החשבוניות שלי'}
            </p>
          </div>
          <span className="text-gray-400 text-xl">←</span>
        </Link>

        {canManage && (
          <>
            <Link
              to="/finance/charges"
              className="card flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">חיובים</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ניהול חיובים קבוצתיים
                  {draftCharges.length > 0 && (
                    <span className="mr-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                      {draftCharges.length}
                    </span>
                  )}
                </p>
              </div>
              <span className="text-gray-400 text-xl">←</span>
            </Link>

            <Link
              to="/finance/payments"
              className="card flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">תשלומים</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">היסטוריית תשלומים</p>
              </div>
              <span className="text-gray-400 text-xl">←</span>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
