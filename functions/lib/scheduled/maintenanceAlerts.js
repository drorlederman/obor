"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maintenanceAlerts = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
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
    // TODO: When notification service is integrated, push alerts to boat admins/maintenance managers
    // For each boat in boatTickets, notify relevant role holders
});
//# sourceMappingURL=maintenanceAlerts.js.map