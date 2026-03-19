import type { Booking } from '@/hooks/useBookings'
import { BOOKING_TYPE_DOT } from './BookingTypeChip'

const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]
const DAY_NAMES = ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳', 'שבת']
const SHORT_DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 06:00-23:00

export type CalendarViewMode = 'day' | 'week' | 'month'

interface Props {
  viewMode: CalendarViewMode
  anchorDate: Date
  bookings: Booking[]
  onViewModeChange: (mode: CalendarViewMode) => void
  onNavigate: (direction: -1 | 1) => void
  onToday: () => void
  onDatePick: (date: Date) => void
  onSlotSelect: (start: Date, end: Date) => void
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfWeek(date: Date) {
  const dayStart = startOfDay(date)
  const day = dayStart.getDay()
  return new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate() - day)
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`
}

function getVisibleDays(viewMode: CalendarViewMode, anchorDate: Date) {
  if (viewMode === 'day') return [startOfDay(anchorDate)]
  const first = startOfWeek(anchorDate)
  return Array.from({ length: 7 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + i))
}

function getViewTitle(viewMode: CalendarViewMode, anchorDate: Date) {
  if (viewMode === 'month') {
    return `${MONTH_NAMES[anchorDate.getMonth()]} ${anchorDate.getFullYear()}`
  }
  if (viewMode === 'day') {
    return anchorDate.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
  }
  const weekStart = startOfWeek(anchorDate)
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6)
  return `${weekStart.getDate()}–${weekEnd.getDate()} ${MONTH_NAMES[weekEnd.getMonth()]}`
}

function MonthView({
  anchorDate,
  bookings,
  onDatePick,
  onViewModeChange,
}: {
  anchorDate: Date
  bookings: Booking[]
  onDatePick: (date: Date) => void
  onViewModeChange: (mode: CalendarViewMode) => void
}) {
  const year = anchorDate.getFullYear()
  const month = anchorDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const activeBookings = bookings.filter((b) => b.status === 'active')
  const bookingsByDay = new Map<number, Booking[]>()
  for (const b of activeBookings) {
    const day = b.startTime.getDate()
    if (!bookingsByDay.has(day)) bookingsByDay.set(day, [])
    bookingsByDay.get(day)!.push(b)
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const today = new Date()
  return (
    <>
      <div className="grid grid-cols-7 mb-1">
        {SHORT_DAY_NAMES.map((name) => (
          <div key={name} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">
            {name}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden">
        {cells.map((day, index) => {
          if (!day) {
            return <div key={index} className="bg-white dark:bg-gray-900 min-h-[78px]" />
          }
          const date = new Date(year, month, day)
          const dayBookings = bookingsByDay.get(day) ?? []
          const isToday = sameDay(date, today)
          return (
            <button
              key={index}
              onClick={() => {
                onDatePick(date)
                onViewModeChange('day')
              }}
              className="bg-white dark:bg-gray-900 min-h-[78px] p-1.5 text-right hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span
                className={`text-sm font-medium inline-flex w-7 h-7 rounded-full items-center justify-center ${
                  isToday ? 'bg-primary-600 text-white' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {day}
              </span>
              <div className="mt-1 flex gap-1 flex-wrap">
                {dayBookings.slice(0, 3).map((booking, i) => (
                  <span key={i} className={`w-1.5 h-1.5 rounded-full ${BOOKING_TYPE_DOT[booking.type]}`} />
                ))}
                {dayBookings.length > 3 && <span className="text-[10px] text-gray-400">+{dayBookings.length - 3}</span>}
              </div>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">לחץ על יום כדי לעבור לתצוגת יום ולבחור סלוט לשיריון</p>
    </>
  )
}

function DayWeekView({
  viewMode,
  anchorDate,
  bookings,
  onSlotSelect,
}: {
  viewMode: CalendarViewMode
  anchorDate: Date
  bookings: Booking[]
  onSlotSelect: (start: Date, end: Date) => void
}) {
  const days = getVisibleDays(viewMode, anchorDate)
  const activeBookings = bookings.filter((b) => b.status === 'active')

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className={`grid ${viewMode === 'day' ? 'grid-cols-[56px_1fr]' : 'grid-cols-[56px_repeat(7,minmax(0,1fr))]'} bg-gray-50 dark:bg-gray-800/40`}>
        <div className="p-2 text-xs text-gray-400 dark:text-gray-500">שעה</div>
        {days.map((date) => (
          <div key={date.toISOString()} className="p-2 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">{DAY_NAMES[date.getDay()]}</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{date.getDate()}</p>
          </div>
        ))}
      </div>

      <div className="max-h-[560px] overflow-auto">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className={`grid ${viewMode === 'day' ? 'grid-cols-[56px_1fr]' : 'grid-cols-[56px_repeat(7,minmax(0,1fr))]'} border-t border-gray-100 dark:border-gray-800`}
          >
            <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-3 bg-gray-50/60 dark:bg-gray-900/30">
              {formatHour(hour)}
            </div>
            {days.map((date) => {
              const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0, 0, 0)
              const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour + 1, 0, 0, 0)
              const slotBookings = activeBookings.filter((b) => b.startTime < end && b.endTime > start)
              return (
                <button
                  key={`${date.toISOString()}-${hour}`}
                  onClick={() => onSlotSelect(start, new Date(start.getTime() + 2 * 60 * 60 * 1000))}
                  className="min-h-[52px] relative border-r border-gray-100 dark:border-gray-800 last:border-r-0 hover:bg-primary-50/70 dark:hover:bg-primary-900/20 transition-colors text-right px-1"
                >
                  {slotBookings.slice(0, 2).map((booking) => (
                    <div
                      key={booking.id}
                      className={`mt-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-white truncate ${BOOKING_TYPE_DOT[booking.type]}`}
                    >
                      {booking.title}
                    </div>
                  ))}
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 p-2 border-t border-gray-100 dark:border-gray-800">
        לחץ על סלוט כדי לפתוח שיריון חדש בזמן הנבחר
      </p>
    </div>
  )
}

export default function BookingCalendar({
  viewMode,
  anchorDate,
  bookings,
  onViewModeChange,
  onNavigate,
  onToday,
  onDatePick,
  onSlotSelect,
}: Props) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate(1)}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="הבא"
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <button
            onClick={onToday}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            היום
          </button>
          <button
            onClick={() => onNavigate(-1)}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="הקודם"
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        <p className="text-sm font-semibold text-gray-900 dark:text-white">{getViewTitle(viewMode, anchorDate)}</p>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex">
          {(['day', 'week', 'month'] as CalendarViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                mode === viewMode
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {mode === 'day' ? 'יום' : mode === 'week' ? 'שבוע' : 'חודש'}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'month' ? (
        <MonthView
          anchorDate={anchorDate}
          bookings={bookings}
          onDatePick={onDatePick}
          onViewModeChange={onViewModeChange}
        />
      ) : (
        <DayWeekView
          viewMode={viewMode}
          anchorDate={anchorDate}
          bookings={bookings}
          onSlotSelect={onSlotSelect}
        />
      )}
    </div>
  )
}
