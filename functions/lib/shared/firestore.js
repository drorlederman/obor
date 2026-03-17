"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocOrThrow = getDocOrThrow;
exports.getDocInTransactionOrThrow = getDocInTransactionOrThrow;
exports.runTransaction = runTransaction;
exports.serverTimestamp = serverTimestamp;
exports.increment = increment;
const firestore_1 = require("firebase-admin/firestore");
const errors_1 = require("./errors");
/**
 * Gets a document and throws a typed error if it doesn't exist.
 */
async function getDocOrThrow(ref, notFoundMessage) {
    const snap = await ref.get();
    if (!snap.exists) {
        throw errors_1.Errors.notFound(notFoundMessage);
    }
    return { id: snap.id, ...snap.data() };
}
/**
 * Gets a document inside a transaction and throws if it doesn't exist.
 */
async function getDocInTransactionOrThrow(transaction, ref, notFoundMessage) {
    const snap = await transaction.get(ref);
    if (!snap.exists) {
        throw errors_1.Errors.notFound(notFoundMessage);
    }
    return { snap, data: { id: snap.id, ...snap.data() } };
}
/**
 * Runs a Firestore transaction with a typed callback.
 */
async function runTransaction(callback) {
    const db = (0, firestore_1.getFirestore)();
    return db.runTransaction(callback);
}
/**
 * Returns a serverTimestamp field value.
 */
function serverTimestamp() {
    const { FieldValue } = require('firebase-admin/firestore');
    return FieldValue.serverTimestamp();
}
/**
 * Returns an increment field value.
 */
function increment(n) {
    const { FieldValue } = require('firebase-admin/firestore');
    return FieldValue.increment(n);
}
//# sourceMappingURL=firestore.js.map