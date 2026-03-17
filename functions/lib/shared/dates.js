"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDate = toDate;
exports.toTimestamp = toTimestamp;
exports.daysFromNow = daysFromNow;
exports.isExpired = isExpired;
exports.rangesOverlap = rangesOverlap;
const firestore_1 = require("firebase-admin/firestore");
/**
 * Converts a Firestore Timestamp or ISO string to a JS Date.
 */
function toDate(value) {
    if (value instanceof firestore_1.Timestamp)
        return value.toDate();
    if (value instanceof Date)
        return value;
    return new Date(value);
}
/**
 * Converts to Firestore Timestamp.
 */
function toTimestamp(value) {
    const date = typeof value === 'string' ? new Date(value) : value;
    return firestore_1.Timestamp.fromDate(date);
}
/**
 * Returns a Timestamp for N days from now.
 */
function daysFromNow(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return firestore_1.Timestamp.fromDate(date);
}
/**
 * Returns true if the given Timestamp is in the past.
 */
function isExpired(ts) {
    return ts.toDate() < new Date();
}
/**
 * Checks if two date ranges overlap.
 * All values are JavaScript Dates.
 */
function rangesOverlap(startA, endA, startB, endB) {
    return startA < endB && endA > startB;
}
//# sourceMappingURL=dates.js.map