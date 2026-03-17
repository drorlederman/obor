"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentReminders = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const email_1 = require("../shared/email");
const notifications_1 = require("../shared/notifications");
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
    // Group by partner
    const partnerInvoices = {};
    for (const doc of snap.docs) {
        const data = doc.data();
        const partnerId = data.partnerId;
        if (!partnerInvoices[partnerId]) {
            partnerInvoices[partnerId] = [];
        }
        partnerInvoices[partnerId].push({
            amount: data.amountRemaining,
            boatId: data.boatId,
        });
    }
    const partnerCount = Object.keys(partnerInvoices).length;
    console.log(`paymentReminders: ${partnerCount} partners have outstanding invoices at ${now.toDate().toISOString()}`);
    // Send email + push to each partner
    await Promise.allSettled(Object.entries(partnerInvoices).map(async ([partnerId, invoices]) => {
        const partnerSnap = await db.doc(`partners/${partnerId}`).get();
        if (!partnerSnap.exists)
            return;
        const partner = partnerSnap.data();
        const totalOwed = invoices.reduce((sum, inv) => sum + inv.amount, 0);
        const boatId = invoices[0].boatId;
        const notificationsSettingsSnap = await db.doc(`system_settings/${boatId}_notifications`).get();
        const invoicesEnabled = notificationsSettingsSnap.data()?.invoices ?? true;
        if (!invoicesEnabled)
            return;
        // Get boat name
        const boatSnap = await db.doc(`boats/${boatId}`).get();
        const boatName = boatSnap.data()?.name ?? 'OBOR';
        // Send email
        if (partner.email) {
            await (0, email_1.sendPaymentReminderEmail)(partner.email, partner.fullName, boatName, totalOwed).catch((err) => console.error(`Email failed for partner ${partnerId}:`, err));
        }
        // Send push notification
        if (partner.userId) {
            await (0, notifications_1.sendPushToUsers)([partner.userId], {
                title: `תזכורת תשלום — ${boatName}`,
                body: `נותרה יתרה לתשלום של ₪${totalOwed.toFixed(2)}`,
                data: { type: 'payment_reminder', boatId },
            }).catch((err) => console.error(`Push failed for partner ${partnerId}:`, err));
        }
    }));
});
//# sourceMappingURL=paymentReminders.js.map