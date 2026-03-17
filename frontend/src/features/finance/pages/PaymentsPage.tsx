import { usePayments } from '@/hooks/usePayments'
import PaymentItem from '@/features/finance/components/PaymentItem'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'

export default function PaymentsPage() {
  const { data: payments, isLoading, error } = usePayments()

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">היסטוריית תשלומים</h1>

      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="card">
          <ErrorState message="שגיאה בטעינת התשלומים" />
        </div>
      )}

      {!isLoading && !error && payments?.length === 0 && (
        <div className="card">
          <EmptyState
            title="אין תשלומים עדיין"
            description="תשלומים שיוזנו יופיעו כאן"
          />
        </div>
      )}

      {payments && payments.length > 0 && (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800 p-0 overflow-hidden">
          {payments.map((payment) => (
            <PaymentItem key={payment.id} payment={payment} />
          ))}
        </div>
      )}
    </div>
  )
}
