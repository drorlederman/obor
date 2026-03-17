import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore } from 'firebase-admin/firestore'

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

  // TODO: When notification service is integrated, push alerts to boat admins/maintenance managers
  // For each boat in boatTickets, notify relevant role holders
})
