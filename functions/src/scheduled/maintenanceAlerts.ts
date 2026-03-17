import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore } from 'firebase-admin/firestore'
import { sendPushToUsers } from '../shared/notifications'

export const maintenanceAlerts = onSchedule('every 24 hours', async () => {
  const db = getFirestore()

  // Find critical/high priority tickets that are open or in-progress
  const snap = await db
    .collection('maintenance_tickets')
    .where('priority', 'in', ['critical', 'high'])
    .where('status', 'in', ['open', 'in_progress', 'waiting_parts'])
    .get()

  if (snap.empty) return

  // Group by boat for alerting
  const boatTickets: Record<string, { ticketId: string; title: string; priority: string; status: string }[]> = {}

  for (const doc of snap.docs) {
    const data = doc.data()
    const boatId = data.boatId as string
    if (!boatTickets[boatId]) {
      boatTickets[boatId] = []
    }
    boatTickets[boatId].push({
      ticketId: doc.id,
      title: data.title as string,
      priority: data.priority as string,
      status: data.status as string,
    })
  }

  const totalAlerts = snap.size
  const boatCount = Object.keys(boatTickets).length
  console.log(
    `maintenanceAlerts: ${totalAlerts} high/critical open tickets across ${boatCount} boats`
  )

  await Promise.allSettled(
    Object.entries(boatTickets).map(async ([boatId, tickets]) => {
      const notificationsSettingsSnap = await db.doc(`system_settings/${boatId}_notifications`).get()
      const maintenanceEnabled = (notificationsSettingsSnap.data()?.maintenance as boolean | undefined) ?? true
      if (!maintenanceEnabled) return

      const membersSnap = await db
        .collection('boat_members')
        .where('boatId', '==', boatId)
        .where('status', '==', 'active')
        .where('role', 'in', ['maintenanceManager', 'admin'])
        .get()

      const userIds = [...new Set(membersSnap.docs.map((doc) => doc.data().userId as string).filter(Boolean))]
      if (userIds.length === 0) return

      const criticalCount = tickets.filter((t) => t.priority === 'critical').length
      const title = `התראת תחזוקה — ${tickets.length} קריאות פתוחות`
      const body = criticalCount > 0
        ? `${criticalCount} קריאות דחופות דורשות טיפול`
        : 'קיימות קריאות בעדיפות גבוהה שממתינות לטיפול'

      await sendPushToUsers(userIds, {
        title,
        body,
        data: { type: 'maintenance_alert', boatId, openCount: String(tickets.length) },
      })
    }),
  )
})
