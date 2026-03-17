"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maintenanceAlerts = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const notifications_1 = require("../shared/notifications");
exports.maintenanceAlerts = (0, scheduler_1.onSchedule)('every 24 hours', async () => {
    const db = (0, firestore_1.getFirestore)();
    // Find critical/high priority tickets that are open or in-progress
    const snap = await db
        .collection('maintenance_tickets')
        .where('priority', 'in', ['critical', 'high'])
        .where('status', 'in', ['open', 'in_progress', 'waiting_parts'])
        .get();
    if (snap.empty)
        return;
    // Group by boat for alerting
    const boatTickets = {};
    for (const doc of snap.docs) {
        const data = doc.data();
        const boatId = data.boatId;
        if (!boatTickets[boatId]) {
            boatTickets[boatId] = [];
        }
        boatTickets[boatId].push({
            ticketId: doc.id,
            title: data.title,
            priority: data.priority,
            status: data.status,
        });
    }
    const totalAlerts = snap.size;
    const boatCount = Object.keys(boatTickets).length;
    console.log(`maintenanceAlerts: ${totalAlerts} high/critical open tickets across ${boatCount} boats`);
    await Promise.allSettled(Object.entries(boatTickets).map(async ([boatId, tickets]) => {
        const notificationsSettingsSnap = await db.doc(`system_settings/${boatId}_notifications`).get();
        const maintenanceEnabled = notificationsSettingsSnap.data()?.maintenance ?? true;
        if (!maintenanceEnabled)
            return;
        const membersSnap = await db
            .collection('boat_members')
            .where('boatId', '==', boatId)
            .where('status', '==', 'active')
            .where('role', 'in', ['maintenanceManager', 'admin'])
            .get();
        const userIds = [...new Set(membersSnap.docs.map((doc) => doc.data().userId).filter(Boolean))];
        if (userIds.length === 0)
            return;
        const criticalCount = tickets.filter((t) => t.priority === 'critical').length;
        const title = `התראת תחזוקה — ${tickets.length} קריאות פתוחות`;
        const body = criticalCount > 0
            ? `${criticalCount} קריאות דחופות דורשות טיפול`
            : 'קיימות קריאות בעדיפות גבוהה שממתינות לטיפול';
        await (0, notifications_1.sendPushToUsers)(userIds, {
            title,
            body,
            data: { type: 'maintenance_alert', boatId, openCount: String(tickets.length) },
        });
    }));
});
//# sourceMappingURL=maintenanceAlerts.js.map