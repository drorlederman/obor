import { collection, query, where, orderBy, Timestamp, doc, type DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useBoat } from '@/context/BoatContext'
import { useFirestoreQuery } from './useFirestoreQuery'
import { useFirestoreDoc } from './useFirestoreDoc'
import type { Booking, BookingType } from '@/types'

export type { Booking }

interface DateRange {
  start: Date
  end: Date
}

function docToBooking(id: string, data: DocumentData): Booking {
  return {
    id,
    boatId: data.boatId as string,
    createdByUserId: data.createdByUserId as string,
    ownerPartnerId: data.ownerPartnerId as string,
    type: data.type as BookingType,
    status: data.status as Booking['status'],
    title: data.title as string,
    notes: (data.notes as string) ?? null,
    startTime: data.startTime.toDate(),
    endTime: data.endTime.toDate(),
    durationHours: data.durationHours as number,
    creditType: (data.creditType as Booking['creditType']) ?? null,
    creditsUsed: (data.creditsUsed as number) ?? 0,
    participants: (data.participants as string[]) ?? [],
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    cancelledAt: data.cancelledAt ? data.cancelledAt.toDate() : null,
    cancelledByUserId: (data.cancelledByUserId as string) ?? null,
  }
}

/** Bookings for a specific month (all statuses). */
export function useBookings(year: number, month: number) {
  const { activeBoatId } = useBoat()
  const result = useFirestoreQuery(
    ['bookings', activeBoatId, year, month],
    activeBoatId
      ? () => query(collection(db, 'bookings'), where('boatId', '==', activeBoatId))
      : null,
    docToBooking,
  )

  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 1)
  const data = result.data
    ?.filter((booking) => booking.startTime >= start && booking.startTime < end)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

  return { ...result, data }
}

/** Bookings intersecting a custom date range (all statuses). */
export function useBookingsRange(range: DateRange | null) {
  const { activeBoatId } = useBoat()
  const result = useFirestoreQuery(
    ['bookings-range', activeBoatId, range?.start.toISOString(), range?.end.toISOString()],
    activeBoatId
      ? () => query(collection(db, 'bookings'), where('boatId', '==', activeBoatId))
      : null,
    docToBooking,
  )

  if (!range) return { ...result, data: [] as Booking[] }

  const data = result.data
    ?.filter((booking) => booking.startTime < range.end && booking.endTime > range.start)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

  return { ...result, data }
}

/** Next N active bookings from now. */
export function useUpcomingBookings(limitCount = 3) {
  const { activeBoatId } = useBoat()
  const result = useFirestoreQuery(
    ['bookings-upcoming', activeBoatId],
    activeBoatId
      ? () =>
          query(
            collection(db, 'bookings'),
            where('boatId', '==', activeBoatId),
            where('status', '==', 'active'),
            where('startTime', '>=', Timestamp.fromDate(new Date())),
            orderBy('startTime', 'asc'),
          )
      : null,
    docToBooking,
  )
  return { ...result, data: result.data?.slice(0, limitCount) }
}

/** Single booking by id. */
export function useBookingById(bookingId: string | undefined) {
  const { activeBoatId } = useBoat()
  return useFirestoreDoc(
    ['booking', activeBoatId, bookingId],
    activeBoatId && bookingId ? doc(db, 'bookings', bookingId) : null,
    docToBooking,
  )
}
