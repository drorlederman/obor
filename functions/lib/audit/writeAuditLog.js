"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAuditLog = writeAuditLog;
const firestore_1 = require("firebase-admin/firestore");
/**
 * Writes an audit log entry. Called by Cloud Functions after critical operations.
 * Only Cloud Functions can write to audit_logs (enforced by Security Rules).
 */
async function writeAuditLog(payload) {
    const db = (0, firestore_1.getFirestore)();
    await db.collection('audit_logs').add({
        ...payload,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
}
//# sourceMappingURL=writeAuditLog.js.map