"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelBooking = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../shared/auth");
const errors_1 = require("../shared/errors");
const firestore_2 = require("../shared/firestore");
const writeAuditLog_1 = require("../audit/writeAuditLog");
exports.cancelBooking = (0, https_1.onCall)(async (request) => {
    const { bookingId } = request.data;
    if (!bookingId)
        throw errors_1.Errors.invalidArgument('bookingId הוא שדה חובה');
    const db = (0, firestore_1.getFirestore)();
    const bookingRef = db.doc(`bookings/${bookingId}`);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists)
        throw errors_1.Errors.notFound('ההזמנה');
    const booking = bookingSnap.data();
    const boatId = booking.boatId;
    const { uid, role } = await (0, auth_1.ensureActiveMemberOf)(request, boatId);
    // Only owner or scheduler/admin can cancel
    const isOwner = booking.createdByUserId === uid;
    const hasPrivilege = role === 'scheduler' || role === 'admin';
    if (!isOwner && !hasPrivilege) {
        throw errors_1.Errors.permissionDenied('רק בעל ההזמנה או מתזמן/מנהל יכולים לבטל הזמנה');
    }
    if (booking.status === 'cancelled') {
        throw errors_1.Errors.preconditionFailed('ההזמנה כבר בוטלה');
    }
    if (booking.status === 'completed') {
        throw errors_1.Errors.preconditionFailed('לא ניתן לבטל הזמנה שהסתיימה');
    }
    const creditsToRefund = booking.creditsUsed ?? 0;
    const creditType = booking.creditType;
    const ownerPartnerId = booking.ownerPartnerId;
    await (0, firestore_2.runTransaction)(async (transaction) => {
        // Re-check booking status inside transaction
        const bookingTransSnap = await transaction.get(bookingRef);
        if (!bookingTransSnap.exists)
            throw errors_1.Errors.notFound('ההזמנה');
        if (bookingTransSnap.data().status === 'cancelled') {
            throw errors_1.Errors.preconditionFailed('ההזמנה כבר בוטלה');
        }
        // Update booking
        transaction.update(bookingRef, {
            status: 'cancelled',
            cancelledAt: (0, firestore_2.serverTimestamp)(),
            cancelledByUserId: uid,
            updatedAt: (0, firestore_2.serverTimestamp)(),
        });
        // Refund credits if applicable
        if (creditsToRefund > 0 && creditType) {
            const partnerRef = db.doc(`partners/${ownerPartnerId}`);
            const partnerSnap = await transaction.get(partnerRef);
            if (partnerSnap.exists) {
                const partnerData = partnerSnap.data();
                const balanceField = creditType === 'weekday' ? 'weekdayCreditsBalance' : 'weekendCreditsBalance';
                const currentBalance = creditType === 'weekday' ? partnerData.weekdayCreditsBalance : partnerData.weekendCreditsBalance;
                const newBalance = currentBalance + creditsToRefund;
                transaction.update(partnerRef, {
                    [balanceField]: firestore_1.FieldValue.increment(creditsToRefund),
                    updatedAt: (0, firestore_2.serverTimestamp)(),
                });
                const creditTxRef = db.collection('credit_transactions').doc();
                transaction.set(creditTxRef, {
                    boatId,
                    partnerId: ownerPartnerId,
                    bookingId,
                    type: 'refund',
                    creditType,
                    amount: creditsToRefund,
                    balanceAfter: newBalance,
                    description: `ביטול הזמנה: ${booking.title}`,
                    createdByUserId: uid,
                    createdAt: (0, firestore_2.serverTimestamp)(),
                });
            }
        }
    });
    await (0, writeAuditLog_1.writeAuditLog)({
        boatId,
        action: 'booking.cancelled',
        performedByUserId: uid,
        entityType: 'booking',
        entityId: bookingId,
        details: { creditsRefunded: creditsToRefund },
    });
    return { success: true };
});
//# sourceMappingURL=cancelBooking.js.map