import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useBookings } from '@/hooks/useBookings'
import BookingCalendar from '@/features/bookings/components/BookingCalendar'
import BookingCard from '@/features/bookings/components/BookingCard'
import { BOOKING_TYPE_LABELS } from '@/features/bookings/components/BookingTypeChip'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { Booking } from '@/hooks/useBookings'
import type { BookingType } from '@/types'

export default function BookingsPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [filterType, setFilterType] = useState<BookingType | 'all'>('all')

  const { data: bookings, isLoading, isError } = useBookings(year, month)

  function handleMonthChange(y: number, m: number) {
    setYear(y)
    setMonth(m)
    setSelectedDay(null)
  }

  // Filter bookings for list
  const listBookings: Booking[] = (bookings ?? []).filter((b) => {
    if (b.status === 'cancelled') return false
    if (filterType !== 'all' && b.type !== filterType) return false
    if (selectedDay !== null && b.startTime.getDate() !== selectedDay) return false
    return true
  })

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">יומן הזמנות</h1>
        <Link to="/bookings/new" className="btn-primary text-sm px-4 py-2">
          + הזמנה
        </Link>
      </div>

      {/* Calendar */}
      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : isError ? (
          <p className="text-center text-sm text-red-500 py-4">שגיאה בטעינת ההזמנות</p>
        ) : (
          <BookingCalendar
            year={year}
            month={month}
            bookings={bookings ?? []}
            onMonthChange={handleMonthChange}
            selectedDay={selectedDay}
            onDaySelect={setSelectedDay}
          />
        )}
      </div>

      {/* Type filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterType('all')}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
            filterType === 'all'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          הכל
        </button>
        {(Object.keys(BOOKING_TYPE_LABELS) as BookingType[]).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type === filterType ? 'all' : type)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              filterType === type
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {BOOKING_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      <section>
        {selectedDay && (
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedDay} בחודש
            </p>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              הצג הכל
            </button>
          </div>
        )}

        {isLoading ? null : listBookings.length > 0 ? (
          <div className="space-y-2">
            {listBookings.map((b) => (
              <BookingCard key={b.id} booking={b} showDate={!selectedDay} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-8">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedDay
                ? 'אין הזמנות ביום זה'
                : 'אין הזמנות בחודש זה'}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
