"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertNoOverlap = assertNoOverlap;
exports.determineCreditType = determineCreditType;
exports.calculateCreditCost = calculateCreditCost;
const firestore_1 = require("firebase-admin/firestore");
const dates_1 = require("./dates");
const errors_1 = require("./errors");
/**
 * Checks for overlapping bookings in the given boat.
 * Throws if an overlap is found.
 */
async function assertNoOverlap(boatId, startTime, endTime, excludeBookingId) {
    const db = (0, firestore_1.getFirestore)();
    // Query bookings that start before our endTime (could overlap)
    const snap = await db
        .collection('bookings')
        .where('boatId', '==', boatId)
        .where('status', 'in', ['upcoming', 'active'])
        .where('startTime', '<', firestore_1.Timestamp.fromDate(endTime))
        .get();
    for (const doc of snap.docs) {
        if (excludeBookingId && doc.id === excludeBookingId)
            continue;
        const booking = doc.data();
        const existingEnd = booking.endTime.toDate();
        const existingStart = booking.startTime.toDate();
        if ((0, dates_1.rangesOverlap)(startTime, endTime, existingStart, existingEnd)) {
            throw errors_1.Errors.bookingOverlap();
        }
    }
}
/**
 * Determines the credit type for a booking based on its duration.
 * Business rule: booking < threshold hours = day credit, else = weekend credit.
 */
function determineCreditType(startTime, endTime, weekendThresholdHours = 36) {
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    return durationHours >= weekendThresholdHours ? 'weekend' : 'day';
}
/**
 * Calculates credit cost for a booking.
 */
function calculateCreditCost(type, dayCreditCost, weekendCreditCost) {
    return type === 'day' ? dayCreditCost : weekendCreditCost;
}
//# sourceMappingURL=booking-utils.js.map