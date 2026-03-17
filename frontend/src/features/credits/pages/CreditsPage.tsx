import { useState } from 'react'
import { usePartner } from '@/hooks/usePartner'
import { useCreditTransactions } from '@/hooks/useCreditTransactions'
import { useBoat } from '@/context/BoatContext'
import CreditTransactionItem from '@/features/credits/components/CreditTransactionItem'
import AdjustCreditsModal from '@/features/credits/components/AdjustCreditsModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

function BalanceCard({
  label,
  balance,
  loading,
}: {
  label: string
  balance: number
  loading: boolean
}) {
  return (
    <div className="card flex-1 text-center py-5">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
        {label}
      </p>
      {loading ? (
        <div className="flex justify-center py-1">
          <LoadingSpinner size="sm" />
        </div>
      ) : (
        <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">{balance}</p>
      )}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">מטבעות</p>
    </div>
  )
}

export default function CreditsPage() {
  const { isAdmin } = useBoat()
  const { data: partner, isLoading: loadingPartner } = usePartner()
  const { data: transactions, isLoading: loadingTx, isError: txError } = useCreditTransactions(30)
  const [showAdjustModal, setShowAdjustModal] = useState(false)

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">מטבעות</h1>
        {isAdmin && (
          <button
            onClick={() => setShowAdjustModal(true)}
            className="btn-primary text-sm px-4 py-2"
          >
            התאם מטבעות
          </button>
        )}
      </div>

      {/* Balance cards */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          יתרה נוכחית
        </h2>
        <div className="flex gap-3">
          <BalanceCard
            label="ימי חול"
            balance={partner?.weekdayCreditsBalance ?? 0}
            loading={loadingPartner}
          />
          <BalanceCard
            label="סוף שבוע"
            balance={partner?.weekendCreditsBalance ?? 0}
            loading={loadingPartner}
          />
        </div>
      </section>

      {/* Transaction history */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          היסטוריית עסקאות
        </h2>

        {loadingTx ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="md" />
          </div>
        ) : txError ? (
          <div className="card text-center py-6">
            <p className="text-sm text-red-500">שגיאה בטעינת ההיסטוריה</p>
          </div>
        ) : transactions && transactions.length > 0 ? (
          <div className="card divide-y divide-gray-100 dark:divide-gray-800 p-0 overflow-hidden">
            {transactions.map((tx) => (
              <div key={tx.id} className="px-4">
                <CreditTransactionItem tx={tx} />
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-10">
            <p className="text-3xl mb-2">🪙</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">אין עסקאות עדיין</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              העסקאות יופיעו כאן לאחר הזמנה ראשונה
            </p>
          </div>
        )}
      </section>

      {/* Legend */}
      <section className="card py-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          מקרא
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: '↓', label: 'שימוש', color: 'text-red-600 dark:text-red-400', desc: 'מטבעות שנוצלו להזמנה' },
            { icon: '↑', label: 'קבלה', color: 'text-green-600 dark:text-green-400', desc: 'מטבעות שנוספו' },
            { icon: '↩', label: 'החזר', color: 'text-green-600 dark:text-green-400', desc: 'החזר לאחר ביטול' },
            { icon: '⚙', label: 'התאמה', color: 'text-blue-600 dark:text-blue-400', desc: 'התאמה ידנית ע"י מנהל' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className={`text-base ${item.color}`}>{item.icon}</span>
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Adjust modal */}
      {showAdjustModal && (
        <AdjustCreditsModal
          defaultPartnerId={partner?.id}
          onClose={() => setShowAdjustModal(false)}
        />
      )}
    </div>
  )
}
