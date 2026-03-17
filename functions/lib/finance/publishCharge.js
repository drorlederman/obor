"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishCharge = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../shared/auth");
const errors_1 = require("../shared/errors");
const firestore_2 = require("../shared/firestore");
const finance_utils_1 = require("../shared/finance-utils");
const writeAuditLog_1 = require("../audit/writeAuditLog");
exports.publishCharge = (0, https_1.onCall)(async (request) => {
    const { chargeId } = request.data;
    if (!chargeId)
        throw errors_1.Errors.invalidArgument('chargeId הוא שדה חובה');
    const db = (0, firestore_1.getFirestore)();
    const chargeRef = db.doc(`charges/${chargeId}`);
    const chargeSnap = await chargeRef.get();
    if (!chargeSnap.exists)
        throw errors_1.Errors.notFound('החיוב');
    const charge = chargeSnap.data();
    const boatId = charge.boatId;
    const { uid } = await (0, auth_1.ensureRoleIn)(request, boatId, ['treasurer', 'admin']);
    if (charge.status !== 'draft') {
        throw errors_1.Errors.preconditionFailed('ניתן לפרסם רק חיובים בסטטוס טיוטה');
    }
    // Query active partners
    const partnersSnap = await db
        .collection('partners')
        .where('boatId', '==', boatId)
        .where('status', '==', 'active')
        .get();
    if (partnersSnap.empty) {
        throw errors_1.Errors.preconditionFailed('לא נמצאו שותפים פעילים לחיוב');
    }
    const activePartnerIds = partnersSnap.docs.map((d) => d.id);
    const splits = (0, finance_utils_1.splitEqually)(charge.totalAmount, activePartnerIds);
    await (0, firestore_2.runTransaction)(async (transaction) => {
        // Re-check charge status
        const chargeTransSnap = await transaction.get(chargeRef);
        if (!chargeTransSnap.exists)
            throw errors_1.Errors.notFound('החיוב');
        if (chargeTransSnap.data().status !== 'draft') {
            throw errors_1.Errors.preconditionFailed('החיוב כבר פורסם');
        }
        // Create invoice for each active partner
        for (const split of splits) {
            const invoiceRef = db.collection('partner_invoices').doc();
            transaction.set(invoiceRef, {
                boatId,
                chargeId,
                partnerId: split.partnerId,
                amount: split.amount,
                amountPaid: 0,
                amountRemaining: split.amount,
                status: 'open',
                dueDate: charge.dueDate,
                createdAt: (0, firestore_2.serverTimestamp)(),
                updatedAt: (0, firestore_2.serverTimestamp)(),
                lastPaymentAt: null,
            });
        }
        // Update charge status
        transaction.update(chargeRef, {
            status: 'published',
            updatedAt: (0, firestore_2.serverTimestamp)(),
        });
    });
    await (0, writeAuditLog_1.writeAuditLog)({
        boatId,
        action: 'charge.published',
        performedByUserId: uid,
        entityType: 'charge',
        entityId: chargeId,
        details: { totalAmount: charge.totalAmount, partnerCount: activePartnerIds.length },
    });
    await (0, writeAuditLog_1.writeAuditLog)({
        boatId,
        action: 'invoice.created',
        performedByUserId: uid,
        entityType: 'charge',
        entityId: chargeId,
        details: { invoiceCount: splits.length },
    });
    return { success: true, invoicesCreated: splits.length };
});
//# sourceMappingURL=publishCharge.js.map