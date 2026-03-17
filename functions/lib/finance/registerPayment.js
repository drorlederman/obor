"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPayment = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../shared/auth");
const errors_1 = require("../shared/errors");
const firestore_2 = require("../shared/firestore");
const dates_1 = require("../shared/dates");
const writeAuditLog_1 = require("../audit/writeAuditLog");
const VALID_METHODS = ['cash', 'bank_transfer', 'card'];
exports.registerPayment = (0, https_1.onCall)(async (request) => {
    const { invoiceId, amount, method, reference = null, notes = null, paidAt } = request.data;
    if (!invoiceId)
        throw errors_1.Errors.invalidArgument('invoiceId הוא שדה חובה');
    if (!amount || amount <= 0)
        throw errors_1.Errors.invalidArgument('סכום התשלום חייב להיות מספר חיובי');
    if (!VALID_METHODS.includes(method))
        throw errors_1.Errors.invalidArgument('אמצעי תשלום לא תקין');
    if (!paidAt)
        throw errors_1.Errors.invalidArgument('תאריך תשלום הוא שדה חובה');
    const db = (0, firestore_1.getFirestore)();
    const invoiceRef = db.doc(`partner_invoices/${invoiceId}`);
    const invoiceSnap = await invoiceRef.get();
    if (!invoiceSnap.exists)
        throw errors_1.Errors.notFound('החשבונית');
    const invoice = invoiceSnap.data();
    const boatId = invoice.boatId;
    const { uid } = await (0, auth_1.ensureRoleIn)(request, boatId, ['treasurer', 'admin']);
    if (invoice.status === 'paid') {
        throw errors_1.Errors.preconditionFailed('החשבונית כבר שולמה במלואה');
    }
    const amountRemaining = invoice.amountRemaining;
    if (amount > amountRemaining) {
        throw errors_1.Errors.invalidArgument(`סכום התשלום (${amount}) גדול מהיתרה לתשלום (${amountRemaining})`);
    }
    const paymentRef = db.collection('payments').doc();
    await (0, firestore_2.runTransaction)(async (transaction) => {
        // Re-read invoice inside transaction
        const invoiceTransSnap = await transaction.get(invoiceRef);
        if (!invoiceTransSnap.exists)
            throw errors_1.Errors.notFound('החשבונית');
        const invoiceData = invoiceTransSnap.data();
        if (invoiceData.status === 'paid') {
            throw errors_1.Errors.preconditionFailed('החשבונית כבר שולמה במלואה');
        }
        const currentAmountPaid = invoiceData.amountPaid;
        const currentAmountRemaining = invoiceData.amountRemaining;
        const newAmountPaid = currentAmountPaid + amount;
        const newAmountRemaining = currentAmountRemaining - amount;
        const newStatus = newAmountRemaining <= 0 ? 'paid' : 'partial';
        // Create payment record
        transaction.set(paymentRef, {
            boatId,
            invoiceId,
            partnerId: invoice.partnerId,
            amount,
            method,
            reference: reference ?? null,
            notes: notes ?? null,
            paidAt: (0, dates_1.toTimestamp)(paidAt),
            createdByUserId: uid,
            createdAt: (0, firestore_2.serverTimestamp)(),
        });
        // Update invoice
        transaction.update(invoiceRef, {
            amountPaid: newAmountPaid,
            amountRemaining: Math.max(0, newAmountRemaining),
            status: newStatus,
            lastPaymentAt: (0, firestore_2.serverTimestamp)(),
            updatedAt: (0, firestore_2.serverTimestamp)(),
        });
    });
    await (0, writeAuditLog_1.writeAuditLog)({
        boatId,
        action: 'payment.registered',
        performedByUserId: uid,
        entityType: 'payment',
        entityId: paymentRef.id,
        details: { invoiceId, amount, method, partnerId: invoice.partnerId },
    });
    return { success: true, paymentId: paymentRef.id };
});
//# sourceMappingURL=registerPayment.js.map