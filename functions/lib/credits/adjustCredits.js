"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustCredits = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../shared/auth");
const errors_1 = require("../shared/errors");
const firestore_2 = require("../shared/firestore");
const writeAuditLog_1 = require("../audit/writeAuditLog");
exports.adjustCredits = (0, https_1.onCall)(async (request) => {
    const { boatId, partnerId, creditType, operation, amount, description } = request.data;
    if (!boatId)
        throw errors_1.Errors.invalidArgument('boatId הוא שדה חובה');
    if (!partnerId)
        throw errors_1.Errors.invalidArgument('partnerId הוא שדה חובה');
    if (!creditType || !['weekday', 'weekend'].includes(creditType)) {
        throw errors_1.Errors.invalidArgument('סוג מטבע לא תקין');
    }
    if (!operation || !['add', 'subtract'].includes(operation)) {
        throw errors_1.Errors.invalidArgument('פעולה לא תקינה');
    }
    if (!amount || amount <= 0) {
        throw errors_1.Errors.invalidArgument('הכמות חייבת להיות מספר חיובי');
    }
    if (!description?.trim()) {
        throw errors_1.Errors.invalidArgument('תיאור הוא שדה חובה');
    }
    const { uid } = await (0, auth_1.ensureAdmin)(request, boatId);
    const db = (0, firestore_1.getFirestore)();
    const partnerRef = db.doc(`partners/${partnerId}`);
    const partnerSnap = await partnerRef.get();
    if (!partnerSnap.exists)
        throw errors_1.Errors.notFound('השותף');
    const partner = partnerSnap.data();
    if (partner.boatId !== boatId)
        throw errors_1.Errors.permissionDenied('השותף אינו שייך לסירה זו');
    const balanceField = creditType === 'weekday' ? 'weekdayCreditsBalance' : 'weekendCreditsBalance';
    const currentBalance = creditType === 'weekday' ? partner.weekdayCreditsBalance : partner.weekendCreditsBalance;
    if (operation === 'subtract' && currentBalance < amount) {
        throw errors_1.Errors.preconditionFailed('אין מספיק מטבעות לביצוע הפחתה זו');
    }
    const delta = operation === 'add' ? amount : -amount;
    const newBalance = currentBalance + delta;
    const txType = operation === 'add' ? 'credit' : 'debit';
    // Update partner balance
    await partnerRef.update({
        [balanceField]: firestore_1.FieldValue.increment(delta),
        updatedAt: (0, firestore_2.serverTimestamp)(),
    });
    // Create credit transaction
    const creditTxRef = db.collection('credit_transactions').doc();
    await creditTxRef.set({
        boatId,
        partnerId,
        bookingId: null,
        type: txType,
        creditType,
        amount,
        balanceAfter: newBalance,
        description: description.trim(),
        createdByUserId: uid,
        createdAt: (0, firestore_2.serverTimestamp)(),
    });
    await (0, writeAuditLog_1.writeAuditLog)({
        boatId,
        action: 'credit.adjusted',
        performedByUserId: uid,
        entityType: 'partner',
        entityId: partnerId,
        details: { creditType, operation, amount, newBalance },
    });
    return { success: true, newBalance };
});
//# sourceMappingURL=adjustCredits.js.map