import type { Booking } from '@/hooks/useBookings'
import { BOOKING_TYPE_DOT } from './BookingTypeChip'

const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

// Sunday = 0 ... Saturday = 6
const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

interface Props {
  year: number
  month: number
  bookings: Booking[]
  onMonthChange: (year: number, month: number) => void
  selectedDay: number | null
  onDaySelect: (day: number | null) => void
}

export default function BookingCalendar({
  year,
  month,
  bookings,
  onMonthChange,
  selectedDay,
  onDaySelect,
}: Props) {
  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay()  // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Group bookings by day
  const bookingsByDay = new Map<number, Booking[]>()
  for (const b of bookings) {
    if (b.status === 'cancelled') continue
    const d = b.startTime.getDate()
    if (!bookingsByDay.has(d)) bookingsByDay.set(d, [])
    bookingsByDay.get(d)!.push(b)
  }

  function prevMonth() {
    if (month === 0) onMonthChange(year - 1, 11)
    else onMonthChange(year, month - 1)
  }

  function nextMonth() {
    if (month === 11) onMonthChange(year + 1, 0)
    else onMonthChange(year, month + 1)
  }

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
  const todayDay = isCurrentMonth ? today.getDate() : -1

  // Cells: empty prefix cells + days
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete rows
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
          aria-label="חודש הבא"
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <span className="font-semibold text-gray-900 dark:text-white text-base">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
          aria-label="חודש קודם"
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden">
        {cells.map((day, idx) => {
          const dayBookings = day ? (bookingsByDay.get(day) ?? []) : []
          const isToday = day === todayDay
          const isSelected = day === selectedDay
          const hasBookings = dayBookings.length > 0

          return (
            <button
              key={idx}
              onClick={() => {
                if (!day) return
                onDaySelect(isSelected ? null : day)
              }}
              disabled={!day}
              className={`bg-white dark:bg-gray-900 min-h-[52px] flex flex-col items-center pt-1.5 pb-1 relative transition-colors ${
                !day ? 'cursor-default' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              } ${isSelected ? 'bg-primary-50 dark:bg-primary-900/30' : ''}`}
            >
              {day && (
                <>
                  <span
                    className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-primary-600 text-white'
                        : isSelected
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {day}
                  </span>
                  {/* Booking dots */}
                  {hasBookings && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-1">
                      {dayBookings.slice(0, 3).map((b, i) => (
                        <span
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${BOOKING_TYPE_DOT[b.type]}`}
                        />
                      ))}
                      {dayBookings.length > 3 && (
                        <span className="text-xs text-gray-400">+</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
