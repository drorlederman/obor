import { Timestamp } from 'firebase-admin/firestore'

/**
 * Converts a Firestore Timestamp or ISO string to a JS Date.
 */
export function toDate(value: Timestamp | string | Date): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date(value)
}

/**
 * Converts to Firestore Timestamp.
 */
export function toTimestamp(value: Date | string): Timestamp {
  const date = typeof value === 'string' ? new Date(value) : value
  return Timestamp.fromDate(date)
}

/**
 * Returns a Timestamp for N days from now.
 */
export function daysFromNow(days: number): Timestamp {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return Timestamp.fromDate(date)
}

/**
 * Returns true if the given Timestamp is in the past.
 */
export function isExpired(ts: Timestamp): boolean {
  return ts.toDate() < new Date()
}

/**
 * Checks if two date ranges overlap.
 * All values are JavaScript Dates.
 */
export function rangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && endA > startB
}
