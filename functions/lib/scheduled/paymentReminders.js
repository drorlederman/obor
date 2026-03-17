"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentReminders = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
exports.paymentReminders = (0, scheduler_1.onSchedule)('every monday 09:00', async () => {
    const db = (0, firestore_1.getFirestore)();
    const now = firestore_1.Timestamp.now();
    // Find overdue and pending invoices
    const snap = await db
        .collection('partner_invoices')
        .where('status', 'in', ['open', 'partial', 'overdue'])
        .get();
    if (snap.empty)
        return;
    // Group by partner for potential notification batching
    const partnerInvoices = {};
    for (const doc of snap.docs) {
        const data = doc.data();
        const partnerId = data.partnerId;
        if (!partnerInvoices[partnerId]) {
            partnerInvoices[partnerId] = [];
        }
        partnerInvoices[partnerId].push({
            invoiceId: doc.id,
            amount: data.amountRemaining,
            status: data.status,
            boatId: data.boatId,
        });
    }
    // Log reminder targets (actual notification sending would integrate with FCM/email here)
    const partnerCount = Object.keys(partnerInvoices).length;
    console.log(`paymentReminders: ${partnerCount} partners have outstanding invoices at ${now.toDate().toISOString()}`);
    // TODO: When notification service is integrated, send FCM/email reminders here
    // For each partner in partnerInvoices, send a push notification or email
});
//# sourceMappingURL=paymentReminders.js.map