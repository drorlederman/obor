import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { sendPushToUsers } from '../shared/notifications'

interface BookingSnapshot {
  id: string
  boatId: string
  ownerPartnerId: string
  participants: string[]
  title: string
  type: string
  startTime: Timestamp
}

const REMINDER_LOCK_WINDOW_MS = 30 * 60 * 1000

export const bookingReminders = onSchedule('every 60 minutes', async () => {
  const db = getFirestore()
  const now = Timestamp.now()
  const horizon = Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000)

  const activeBookingsSnap = await db
    .collection('bookings')
    .where('status', '==', 'active')
    .get()

  if (activeBookingsSnap.empty) return

  const eligibleBookings: BookingSnapshot[] = []
  for (const bookingDoc of activeBookingsSnap.docs) {
    const data = bookingDoc.data()
    const startTime = data.startTime as Timestamp | undefined
    const reminderSentAt = data.reminderSentAt as Timestamp | null | undefined
    const reminderLockUntil = data.reminderLockUntil as Timestamp | null | undefined
    const type = (data.type as string) ?? ''

    if (!startTime) continue
    if (type === 'maintenance_block') continue
    if (reminderSentAt) continue
    if (reminderLockUntil && reminderLockUntil.toMillis() > now.toMillis()) continue
    if (startTime.toMillis() < now.toMillis()) continue
    if (startTime.toMillis() > horizon.toMillis()) continue

    eligibleBookings.push({
      id: bookingDoc.id,
      boatId: data.boatId as string,
      ownerPartnerId: data.ownerPartnerId as string,
      participants: ((data.participants as string[] | undefined) ?? []).filter(Boolean),
      title: ((data.title as string) ?? 'הזמנה מתוכננת').trim(),
      type,
      startTime,
    })
  }

  if (eligibleBookings.length === 0) return

  const boatsToNotify = [...new Set(eligibleBookings.map((booking) => booking.boatId))]
  const bookingRemindersEnabled = new Map<string, boolean>()
  await Promise.all(
    boatsToNotify.map(async (boatId) => {
      const settingsSnap = await db.doc(`system_settings/${boatId}_notifications`).get()
      const enabled = (settingsSnap.data()?.bookingReminders as boolean | undefined) ?? true
      bookingRemindersEnabled.set(boatId, enabled)
    }),
  )

  const partnerIds = new Set<string>()
  for (const booking of eligibleBookings) {
    partnerIds.add(booking.ownerPartnerId)
    for (const participantId of booking.participants) {
      partnerIds.add(participantId)
    }
  }

  const partnerIdToUserId = new Map<string, string>()
  const partnerRefs = [...partnerIds].map((partnerId) => db.doc(`partners/${partnerId}`))
  await Promise.all(
    partnerRefs.map(async (ref) => {
      const snap = await ref.get()
      if (!snap.exists) return
      const userId = snap.data()?.userId as string | undefined
      if (userId) {
        partnerIdToUserId.set(ref.id, userId)
      }
    }),
  )

  const boatNameCache = new Map<string, string>()
  let sentCount = 0

  await Promise.allSettled(
    eligibleBookings.map(async (booking) => {
      if (!bookingRemindersEnabled.get(booking.boatId)) return
      const bookingRef = db.doc(`bookings/${booking.id}`)
      const acquired = await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(bookingRef)
        if (!snap.exists) return false
        const data = snap.data()!
        const sentAt = data.reminderSentAt as Timestamp | null | undefined
        const lockUntil = data.reminderLockUntil as Timestamp | null | undefined
        if (sentAt) return false
        if (lockUntil && lockUntil.toMillis() > now.toMillis()) return false

        transaction.update(bookingRef, {
          reminderLockUntil: Timestamp.fromMillis(now.toMillis() + REMINDER_LOCK_WINDOW_MS),
        })
        return true
      })

      if (!acquired) return

      const userIds = new Set<string>()
      const ownerUserId = partnerIdToUserId.get(booking.ownerPartnerId)
      if (ownerUserId) userIds.add(ownerUserId)

      for (const participantId of booking.participants) {
        const participantUserId = partnerIdToUserId.get(participantId)
        if (participantUserId) userIds.add(participantUserId)
      }

      if (userIds.size === 0) return

      let boatName = boatNameCache.get(booking.boatId)
      if (!boatName) {
        const boatSnap = await db.doc(`boats/${booking.boatId}`).get()
        boatName = ((boatSnap.data()?.name as string | undefined) ?? 'הסירה').trim()
        boatNameCache.set(booking.boatId, boatName)
      }

      const startAt = booking.startTime.toDate()
      const dateLabel = startAt.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
      const timeLabel = startAt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

      try {
        await sendPushToUsers([...userIds], {
          title: `תזכורת הפלגה — ${boatName}`,
          body: `${booking.title} ב-${dateLabel} בשעה ${timeLabel}`,
          data: {
            type: 'booking_reminder',
            boatId: booking.boatId,
            bookingId: booking.id,
          },
        })

        await bookingRef.update({
          reminderSentAt: now,
          reminderLockUntil: null,
        })
        sentCount++
      } catch (err) {
        await bookingRef.update({ reminderLockUntil: null })
        console.error(`bookingReminders: failed for booking ${booking.id}`, err)
      }
    }),
  )

  console.log(`bookingReminders: sent reminders for ${sentCount} bookings`)
})
