"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markOverdueInvoices = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
exports.markOverdueInvoices = (0, scheduler_1.onSchedule)('every 24 hours', async () => {
    const db = (0, firestore_1.getFirestore)();
    const now = firestore_1.Timestamp.now();
    // Query open/partial invoices with past due date
    const snap = await db
        .collection('partner_invoices')
        .where('status', 'in', ['open', 'partial'])
        .where('dueDate', '<', now)
        .get();
    if (snap.empty)
        return;
    const BATCH_SIZE = 499;
    let processed = 0;
    for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
        const chunk = snap.docs.slice(i, i + BATCH_SIZE);
        const batch = db.batch();
        for (const doc of chunk) {
            const data = doc.data();
            const amountRemaining = data.amountRemaining;
            if (amountRemaining > 0) {
                batch.update(doc.ref, {
                    status: 'overdue',
                    updatedAt: now,
                });
                processed++;
            }
        }
        await batch.commit();
    }
    console.log(`markOverdueInvoices: marked ${processed} invoices as overdue`);
});
//# sourceMappingURL=markOverdueInvoices.js.map