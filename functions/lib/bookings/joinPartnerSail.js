"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinPartnerSail = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../shared/auth");
const errors_1 = require("../shared/errors");
const firestore_2 = require("../shared/firestore");
const booking_utils_1 = require("../shared/booking-utils");
const writeAuditLog_1 = require("../audit/writeAuditLog");
exports.joinPartnerSail = (0, https_1.onCall)(async (request) => {
    const { bookingId, partnerPartnerId } = request.data;
    if (!bookingId)
        throw errors_1.Errors.invalidArgument('bookingId הוא שדה חובה');
    if (!partnerPartnerId)
        throw errors_1.Errors.invalidArgument('partnerPartnerId הוא שדה חובה');
    const db = (0, firestore_1.getFirestore)();
    const bookingRef = db.doc(`bookings/${bookingId}`);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists)
        throw errors_1.Errors.notFound('ההזמנה');
    const booking = bookingSnap.data();
    const boatId = booking.boatId;
    const { uid } = await (0, auth_1.ensureActiveMemberOf)(request, boatId);
    // Validate booking type
    if (booking.type !== 'partner_sail') {
        throw errors_1.Errors.preconditionFailed('ניתן להצטרף רק להזמנות שיט משותף');
    }
    if (booking.status !== 'active') {
        throw errors_1.Errors.preconditionFailed('לא ניתן להצטרף להזמנה שאינה פעילה');
    }
    // Check booking is in the future
    const startTime = booking.startTime.toDate();
    if (startTime <= new Date()) {
        throw errors_1.Errors.preconditionFailed('לא ניתן להצטרף להזמנה שכבר התחילה');
    }
    // Load partner to verify ownership
    const partnerRef = db.doc(`partners/${partnerPartnerId}`);
    const partnerSnap = await partnerRef.get();
    if (!partnerSnap.exists)
        throw errors_1.Errors.notFound('השותף');
    const partner = partnerSnap.data();
    if (partner.boatId !== boatId)
        throw errors_1.Errors.permissionDenied('השותף אינו שייך לסירה זו');
    if (partner.userId !== uid)
        throw errors_1.Errors.permissionDenied('לא ניתן להצטרף בשם שותף אחר');
    // Check not already a participant
    const participants = booking.participants ?? [];
    if (participants.includes(partnerPartnerId)) {
        throw errors_1.Errors.alreadyExists('הינך כבר רשום כמשתתף בהזמנה זו');
    }
    // Check financial freeze
    if (partner.financialStatus === 'frozen') {
        throw errors_1.Errors.frozenPartner();
    }
    // Calculate credit cost
    const creditType = booking.creditType;
    const settingsDoc = await db.doc(`system_settings/${boatId}_credits`).get();
    const settings = settingsDoc.exists ? settingsDoc.data() : { dayCreditCost: 1, weekendCreditCost: 2 };
    const rawCreditType = creditType === 'weekday' ? 'day' : 'weekend';
    const creditCost = (0, booking_utils_1.calculateCreditCost)(rawCreditType, settings.dayCreditCost, settings.weekendCreditCost);
    const currentBalance = creditType === 'weekday' ? partner.weekdayCreditsBalance : partner.weekendCreditsBalance;
    if (currentBalance < creditCost) {
        throw errors_1.Errors.insufficientCredits();
    }
    await (0, firestore_2.runTransaction)(async (transaction) => {
        // Re-check partner balance
        const partnerTransSnap = await transaction.get(partnerRef);
        if (!partnerTransSnap.exists)
            throw errors_1.Errors.notFound('השותף');
        const partnerData = partnerTransSnap.data();
        const balance = creditType === 'weekday' ? partnerData.weekdayCreditsBalance : partnerData.weekendCreditsBalance;
        if (balance < creditCost)
            throw errors_1.Errors.insufficientCredits();
        const balanceField = creditType === 'weekday' ? 'weekdayCreditsBalance' : 'weekendCreditsBalance';
        const newBalance = balance - creditCost;
        // Update partner credits
        transaction.update(partnerRef, {
            [balanceField]: firestore_1.FieldValue.increment(-creditCost),
            updatedAt: (0, firestore_2.serverTimestamp)(),
        });
        // Add participant to booking
        transaction.update(bookingRef, {
            participants: firestore_1.FieldValue.arrayUnion(partnerPartnerId),
            updatedAt: (0, firestore_2.serverTimestamp)(),
        });
        // Create credit transaction
        const creditTxRef = db.collection('credit_transactions').doc();
        transaction.set(creditTxRef, {
            boatId,
            partnerId: partnerPartnerId,
            bookingId,
            type: 'debit',
            creditType,
            amount: creditCost,
            balanceAfter: newBalance,
            description: `הצטרפות לשיט משותף: ${booking.title}`,
            createdByUserId: uid,
            createdAt: (0, firestore_2.serverTimestamp)(),
        });
    });
    await (0, writeAuditLog_1.writeAuditLog)({
        boatId,
        action: 'booking.partner_joined',
        performedByUserId: uid,
        entityType: 'booking',
        entityId: bookingId,
        details: { partnerPartnerId, creditsUsed: creditCost },
    });
    return { success: true };
});
//# sourceMappingURL=joinPartnerSail.js.map