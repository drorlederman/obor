"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMaintenanceUpdate = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../shared/auth");
const errors_1 = require("../shared/errors");
const firestore_2 = require("../shared/firestore");
exports.addMaintenanceUpdate = (0, https_1.onCall)(async (request) => {
    const { ticketId, comment } = request.data;
    if (!ticketId)
        throw errors_1.Errors.invalidArgument('ticketId הוא שדה חובה');
    if (!comment?.trim())
        throw errors_1.Errors.invalidArgument('תוכן העדכון הוא שדה חובה');
    const db = (0, firestore_1.getFirestore)();
    const ticketRef = db.doc(`maintenance_tickets/${ticketId}`);
    const ticketSnap = await ticketRef.get();
    if (!ticketSnap.exists)
        throw errors_1.Errors.notFound('קריאת התחזוקה');
    const ticket = ticketSnap.data();
    const boatId = ticket.boatId;
    const { uid } = await (0, auth_1.ensureRoleIn)(request, boatId, ['maintenanceManager', 'admin']);
    if (ticket.status === 'closed') {
        throw errors_1.Errors.preconditionFailed('לא ניתן להוסיף עדכון לקריאה סגורה');
    }
    const now = (0, firestore_2.serverTimestamp)();
    const batch = db.batch();
    const updateRef = db.collection('maintenance_updates').doc();
    batch.set(updateRef, {
        boatId,
        ticketId,
        comment: comment.trim(),
        statusBefore: null,
        statusAfter: null,
        createdByUserId: uid,
        createdAt: now,
    });
    batch.update(ticketRef, {
        updatedAt: now,
    });
    await batch.commit();
    return { success: true, updateId: updateRef.id };
});
//# sourceMappingURL=addMaintenanceUpdate.js.map