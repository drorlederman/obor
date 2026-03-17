import { Link } from 'react-router-dom'
import type { Booking } from '@/hooks/useBookings'
import BookingTypeChip from './BookingTypeChip'

function formatDateTime(d: Date) {
  return d.toLocaleString('he-IL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface Props {
  booking: Booking
  showDate?: boolean
}

export default function BookingCard({ booking, showDate = true }: Props) {
  const isPast = booking.endTime < new Date()

  return (
    <Link
      to={`/bookings/${booking.id}`}
      className={`card block hover:shadow-md transition-shadow ${
        isPast ? 'opacity-60' : ''
      } ${booking.status === 'cancelled' ? 'opacity-40 line-through' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {booking.title}
          </p>
          {showDate && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {formatDateTime(booking.startTime)}
            </p>
          )}
          {!showDate && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {booking.startTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              {' — '}
              {booking.endTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          {booking.creditsUsed > 0 && booking.creditType && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {booking.creditsUsed} מטבע{booking.creditsUsed !== 1 ? 'ות' : ''}{' '}
              {booking.creditType === 'weekday' ? 'יום חול' : 'סוף שבוע'}
            </p>
          )}
        </div>
        <BookingTypeChip type={booking.type} size="sm" />
      </div>
    </Link>
  )
}
