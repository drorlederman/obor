import { Link } from 'react-router-dom'
import { useUpcomingBookings } from '@/hooks/useBookings'
import { usePartner } from '@/hooks/usePartner'
import { useAuth } from '@/context/AuthContext'
import BookingCard from '@/features/bookings/components/BookingCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

function CreditCard({
  label,
  balance,
  loading,
}: {
  label: string
  balance: number
  loading: boolean
}) {
  return (
    <div className="card flex-1 text-center">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      {loading ? (
        <div className="flex justify-center py-1">
          <LoadingSpinner size="sm" />
        </div>
      ) : (
        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{balance}</p>
      )}
      <p className="text-xs text-gray-400 dark:text-gray-500">מטבעות</p>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: upcomingBookings, isLoading: loadingBookings } = useUpcomingBookings(3)
  const { data: partner, isLoading: loadingPartner } = usePartner()

  const firstName = user?.displayName?.split(' ')[0] ?? 'שותף'

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      {/* Greeting */}
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          שלום, {firstName} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {new Date().toLocaleDateString('he-IL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Credit balances */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
          יתרת מטבעות
        </h2>
        <div className="flex gap-3">
          <CreditCard
            label="ימי חול"
            balance={partner?.weekdayCreditsBalance ?? 0}
            loading={loadingPartner}
          />
          <CreditCard
            label="סוף שבוע"
            balance={partner?.weekendCreditsBalance ?? 0}
            loading={loadingPartner}
          />
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
          פעולות מהירות
        </h2>
        <div className="flex gap-3">
          <Link to="/bookings/new" className="btn-primary flex-1 text-center text-sm">
            + הזמנה חדשה
          </Link>
          <Link to="/bookings" className="btn-secondary flex-1 text-center text-sm">
            יומן הזמנות
          </Link>
        </div>
      </section>

      {/* Upcoming bookings */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            הזמנות קרובות
          </h2>
          <Link
            to="/bookings"
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
          >
            כל ההזמנות
          </Link>
        </div>

        {loadingBookings ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : upcomingBookings && upcomingBookings.length > 0 ? (
          <div className="space-y-2">
            {upcomingBookings.map((b) => (
              <BookingCard key={b.id} booking={b} showDate />
            ))}
          </div>
        ) : (
          <div className="card text-center py-8">
            <p className="text-4xl mb-2">⛵</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">אין הזמנות קרובות</p>
            <Link
              to="/bookings/new"
              className="mt-3 inline-block text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              הזמן עכשיו
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
