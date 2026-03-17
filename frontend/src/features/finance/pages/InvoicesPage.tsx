import { useState } from 'react'
import { useInvoices } from '@/hooks/useInvoices'
import { useBoat } from '@/context/BoatContext'
import InvoiceCard from '@/features/finance/components/InvoiceCard'
import RegisterPaymentModal from '@/features/finance/components/RegisterPaymentModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { PartnerInvoice } from '@/types'

const STATUS_TABS = [
  { value: 'all', label: 'הכל' },
  { value: 'open', label: 'פתוח' },
  { value: 'partial', label: 'חלקי' },
  { value: 'overdue', label: 'באיחור' },
  { value: 'paid', label: 'שולם' },
] as const

type TabValue = (typeof STATUS_TABS)[number]['value']

export default function InvoicesPage() {
  const { isTreasurer, isAdmin } = useBoat()
  const canManage = isTreasurer || isAdmin
  const { data: invoices, isLoading, error } = useInvoices()
  const [selectedTab, setSelectedTab] = useState<TabValue>('all')
  const [paymentInvoice, setPaymentInvoice] = useState<PartnerInvoice | null>(null)

  const filtered =
    selectedTab === 'all'
      ? invoices ?? []
      : (invoices ?? []).filter((inv) => inv.status === selectedTab)

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
        {canManage ? 'חשבוניות שותפים' : 'החשבוניות שלי'}
      </h1>

      {/* Status filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedTab(tab.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedTab === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="card text-center text-red-500">
          שגיאה בטעינת החשבוניות
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">אין חשבוניות להצגה</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onRegisterPayment={canManage ? () => setPaymentInvoice(invoice) : undefined}
            />
          ))}
        </div>
      )}

      {paymentInvoice && (
        <RegisterPaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
        />
      )}
    </div>
  )
}
