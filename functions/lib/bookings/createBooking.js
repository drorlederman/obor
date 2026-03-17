"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBooking = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../shared/auth");
const errors_1 = require("../shared/errors");
const firestore_2 = require("../shared/firestore");
const dates_1 = require("../shared/dates");
const booking_utils_1 = require("../shared/booking-utils");
const writeAuditLog_1 = require("../audit/writeAuditLog");
const notifications_1 = require("../shared/notifications");
exports.createBooking = (0, https_1.onCall)(async (request) => {
    const { boatId, ownerPartnerId, type, title, notes = null, startTime: startStr, endTime: endStr } = request.data;
    if (!boatId)
        throw errors_1.Errors.invalidArgument('boatId הוא שדה חובה');
    if (!ownerPartnerId)
        throw errors_1.Errors.invalidArgument('ownerPartnerId הוא שדה חובה');
    if (!type)
        throw errors_1.Errors.invalidArgument('סוג הזמנה הוא שדה חובה');
    if (!title?.trim())
        throw errors_1.Errors.invalidArgument('כותרת ההזמנה היא שדה חובה');
    if (!startStr || !endStr)
        throw errors_1.Errors.invalidArgument('תאריך התחלה וסיום הם שדות חובה');
    const startTime = (0, dates_1.toDate)(startStr);
    const endTime = (0, dates_1.toDate)(endStr);
    if (endTime <= startTime) {
        throw errors_1.Errors.invalidArgument('תאריך הסיום חייב להיות אחרי תאריך ההתחלה');
    }
    // Maintenance blocks require scheduler or admin
    if (type === 'maintenance_block') {
        await (0, auth_1.ensureRoleIn)(request, boatId, ['scheduler', 'admin']);
    }
    else {
        await (0, auth_1.ensureActiveMemberOf)(request, boatId);
    }
    const { uid } = await (0, auth_1.ensureActiveMemberOf)(request, boatId);
    const db = (0, firestore_1.getFirestore)();
    // Load partner to verify ownership and check financial status
    const partnerRef = db.doc(`partners/${ownerPartnerId}`);
    const partnerSnap = await partnerRef.get();
    if (!partnerSnap.exists)
        throw errors_1.Errors.notFound('השותף');
    const partner = partnerSnap.data();
    if (partner.boatId !== boatId)
        throw errors_1.Errors.permissionDenied('השותף אינו שייך לסירה זו');
    // Non-maintenance bookings: check financial freeze and credits
    let creditType = null;
    let creditCost = 0;
    if (type !== 'maintenance_block') {
        if (partner.financialStatus === 'frozen') {
            throw errors_1.Errors.frozenPartner();
        }
        // Load credits settings
        const settingsDoc = await db.doc(`system_settings/${boatId}_credits`).get();
        const settings = settingsDoc.exists ? settingsDoc.data() : { dayCreditCost: 1, weekendCreditCost: 2 };
        const rawCreditType = (0, booking_utils_1.determineCreditType)(startTime, endTime);
        creditType = rawCreditType === 'day' ? 'weekday' : 'weekend';
        creditCost = (0, booking_utils_1.calculateCreditCost)(rawCreditType, settings.dayCreditCost, settings.weekendCreditCost);
        const currentBalance = creditType === 'weekday' ? partner.weekdayCreditsBalance : partner.weekendCreditsBalance;
        if (currentBalance < creditCost) {
            throw errors_1.Errors.insufficientCredits();
        }
    }
    // Pre-check for overlaps (outside transaction)
    await (0, booking_utils_1.assertNoOverlap)(boatId, startTime, endTime);
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    // Atomic booking creation + credit debit
    const bookingRef = db.collection('bookings').doc();
    const bookingId = bookingRef.id;
    await (0, firestore_2.runTransaction)(async (transaction) => {
        // Re-check partner inside transaction
        const partnerTransSnap = await transaction.get(partnerRef);
        if (!partnerTransSnap.exists)
            throw errors_1.Errors.notFound('השותף');
        const partnerData = partnerTransSnap.data();
        if (type !== 'maintenance_block') {
            const balance = creditType === 'weekday' ? partnerData.weekdayCreditsBalance : partnerData.weekendCreditsBalance;
            if (balance < creditCost)
                throw errors_1.Errors.insufficientCredits();
            // Debit credits
            const balanceField = creditType === 'weekday' ? 'weekdayCreditsBalance' : 'weekendCreditsBalance';
            const newBalance = balance - creditCost;
            transaction.update(partnerRef, {
                [balanceField]: firestore_1.FieldValue.increment(-creditCost),
                updatedAt: (0, firestore_2.serverTimestamp)(),
            });
            // Create credit transaction
            const creditTxRef = db.collection('credit_transactions').doc();
            transaction.set(creditTxRef, {
                boatId,
                partnerId: ownerPartnerId,
                bookingId,
                type: 'debit',
                creditType,
                amount: creditCost,
                balanceAfter: newBalance,
                description: `הזמנה: ${title.trim()}`,
                createdByUserId: uid,
                createdAt: (0, firestore_2.serverTimestamp)(),
            });
        }
        // Create booking
        transaction.set(bookingRef, {
            boatId,
            createdByUserId: uid,
            ownerPartnerId,
            type,
            status: 'active',
            title: title.trim(),
            notes,
            startTime: (0, dates_1.toTimestamp)(startTime),
            endTime: (0, dates_1.toTimestamp)(endTime),
            durationHours,
            creditType,
            creditsUsed: creditCost,
            participants: type === 'partner_sail' ? [ownerPartnerId] : [],
            createdAt: (0, firestore_2.serverTimestamp)(),
            updatedAt: (0, firestore_2.serverTimestamp)(),
            cancelledAt: null,
            cancelledByUserId: null,
        });
    });
    await (0, writeAuditLog_1.writeAuditLog)({
        boatId,
        action: 'booking.created',
        performedByUserId: uid,
        entityType: 'booking',
        entityId: bookingId,
        details: { type, title: title.trim(), startTime: startStr, endTime: endStr, creditsUsed: creditCost },
    });
    // Notify all boat members (non-blocking)
    (0, notifications_1.sendPushToBoatMembers)(boatId, {
        title: 'הזמנה חדשה',
        body: `${title.trim()} — ${new Date(startStr).toLocaleDateString('he-IL')}`,
        data: { type: 'booking_created', boatId, bookingId },
    }, uid).catch((err) => console.error('sendPushToBoatMembers failed:', err));
    return { success: true, bookingId };
});
//# sourceMappingURL=createBooking.js.map