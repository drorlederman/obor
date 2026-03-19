import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useBookingsRange } from '@/hooks/useBookings'
import BookingCalendar from '@/features/bookings/components/BookingCalendar'
import BookingCard from '@/features/bookings/components/BookingCard'
import { BOOKING_TYPE_LABELS } from '@/features/bookings/components/BookingTypeChip'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import type { Booking } from '@/hooks/useBookings'
import type { BookingType } from '@/types'
import type { CalendarSelectionRange, CalendarViewMode } from '@/features/bookings/components/BookingCalendar'

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfWeek(date: Date) {
  const dayStart = startOfDay(date)
  return new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate() - dayStart.getDay())
}

function getRangeForView(viewMode: CalendarViewMode, anchorDate: Date) {
  if (viewMode === 'day') {
    const start = startOfDay(anchorDate)
    return { start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1) }
  }
  if (viewMode === 'week') {
    const start = startOfWeek(anchorDate)
    return { start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7) }
  }
  return {
    start: new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1),
    end: new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 1),
  }
}

export default function BookingsPage() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week')
  const [anchorDate, setAnchorDate] = useState(new Date())
  const [filterType, setFilterType] = useState<BookingType | 'all'>('all')
  const [selectedRange, setSelectedRange] = useState<CalendarSelectionRange | null>(null)
  const range = useMemo(() => getRangeForView(viewMode, anchorDate), [viewMode, anchorDate])

  const { data: bookings, isLoading, isError } = useBookingsRange(range)

  function handleNavigate(direction: -1 | 1) {
    const next = new Date(anchorDate)
    if (viewMode === 'day') {
      next.setDate(next.getDate() + direction)
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + direction * 7)
    } else {
      next.setMonth(next.getMonth() + direction)
    }
    setAnchorDate(next)
    setSelectedRange(null)
  }

  function handleReserveRange(start: Date, end: Date) {
    navigate(`/bookings/new?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`)
  }

  const listBookings: Booking[] = (bookings ?? []).filter((b) => {
    if (b.status === 'cancelled') return false
    if (filterType !== 'all' && b.type !== filterType) return false
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
          <ErrorState message="שגיאה בטעינת ההזמנות" />
        ) : (
          <BookingCalendar
            viewMode={viewMode}
            anchorDate={anchorDate}
            bookings={bookings ?? []}
            onViewModeChange={(mode) => {
              setViewMode(mode)
              setSelectedRange(null)
            }}
            onNavigate={handleNavigate}
            onToday={() => {
              setAnchorDate(new Date())
              setSelectedRange(null)
            }}
            onDatePick={(date) => {
              setAnchorDate(date)
              setSelectedRange(null)
            }}
            selectedRange={selectedRange}
            onSlotRangeChange={setSelectedRange}
          />
        )}
      </div>

      {selectedRange && (
        <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            נבחר טווח: {' '}
            <span className="font-semibold">
              {selectedRange.start.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
            {' '}–{' '}
            <span className="font-semibold">
              {selectedRange.end.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </p>
          <button
            onClick={() => handleReserveRange(selectedRange.start, selectedRange.end)}
            className="btn-primary text-sm px-4 py-2"
          >
            שריין את הטווח שנבחר
          </button>
        </div>
      )}

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
        <div className="mb-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {viewMode === 'day' ? 'הזמנות ליום הנבחר' : viewMode === 'week' ? 'הזמנות לשבוע הנבחר' : 'הזמנות לחודש הנבחר'}
          </p>
        </div>

        {isLoading || isError ? null : listBookings.length > 0 ? (
          <div className="space-y-2">
            {listBookings.map((b) => (
              <BookingCard key={b.id} booking={b} showDate={viewMode !== 'day'} />
            ))}
          </div>
        ) : (
          <div className="card">
            <EmptyState
              title={viewMode === 'day' ? 'אין הזמנות ביום זה' : viewMode === 'week' ? 'אין הזמנות בשבוע זה' : 'אין הזמנות בחודש זה'}
              description="אפשר לבחור כמה סלוטים של חצי שעה ביומן כדי ליצור הזמנה חדשה"
            />
          </div>
        )}
      </section>
    </div>
  )
}
