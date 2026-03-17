import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { rangesOverlap } from './dates'
import { Errors } from './errors'

export type BookingType = 'private' | 'partner_sail' | 'maintenance_block'
export type BookingStatus = 'upcoming' | 'active' | 'completed' | 'cancelled'

interface ExistingBooking {
  id: string
  startTime: Timestamp
  endTime: Timestamp
  status: BookingStatus
}

/**
 * Checks for overlapping bookings in the given boat.
 * Throws if an overlap is found.
 */
export async function assertNoOverlap(
  boatId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string,
): Promise<void> {
  const db = getFirestore()

  // Query bookings that start before our endTime (could overlap)
  const snap = await db
    .collection('bookings')
    .where('boatId', '==', boatId)
    .where('status', 'in', ['upcoming', 'active'])
    .where('startTime', '<', Timestamp.fromDate(endTime))
    .get()

  for (const doc of snap.docs) {
    if (excludeBookingId && doc.id === excludeBookingId) continue

    const booking = doc.data() as ExistingBooking
    const existingEnd = booking.endTime.toDate()
    const existingStart = booking.startTime.toDate()

    if (rangesOverlap(startTime, endTime, existingStart, existingEnd)) {
      throw Errors.bookingOverlap()
    }
  }
}

/**
 * Determines the credit type for a booking based on its duration.
 * Business rule: booking < threshold hours = day credit, else = weekend credit.
 */
export function determineCreditType(
  startTime: Date,
  endTime: Date,
  weekendThresholdHours = 36,
): 'day' | 'weekend' {
  const durationMs = endTime.getTime() - startTime.getTime()
  const durationHours = durationMs / (1000 * 60 * 60)
  return durationHours >= weekendThresholdHours ? 'weekend' : 'day'
}

/**
 * Calculates credit cost for a booking.
 */
export function calculateCreditCost(
  type: 'day' | 'weekend',
  dayCreditCost: number,
  weekendCreditCost: number,
): number {
  return type === 'day' ? dayCreditCost : weekendCreditCost
}
