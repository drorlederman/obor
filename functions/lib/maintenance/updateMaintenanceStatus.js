"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMaintenanceStatus = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../shared/auth");
const errors_1 = require("../shared/errors");
const firestore_2 = require("../shared/firestore");
const writeAuditLog_1 = require("../audit/writeAuditLog");
const VALID_STATUSES = ['open', 'in_progress', 'waiting_parts', 'resolved', 'closed'];
exports.updateMaintenanceStatus = (0, https_1.onCall)(async (request) => {
    const { ticketId, status: newStatus, comment = null } = request.data;
    if (!ticketId)
        throw errors_1.Errors.invalidArgument('ticketId הוא שדה חובה');
    if (!VALID_STATUSES.includes(newStatus))
        throw errors_1.Errors.invalidArgument('סטטוס לא תקין');
    const db = (0, firestore_1.getFirestore)();
    const ticketRef = db.doc(`maintenance_tickets/${ticketId}`);
    const ticketSnap = await ticketRef.get();
    if (!ticketSnap.exists)
        throw errors_1.Errors.notFound('קריאת התחזוקה');
    const ticket = ticketSnap.data();
    const boatId = ticket.boatId;
    const { uid } = await (0, auth_1.ensureRoleIn)(request, boatId, ['maintenanceManager', 'admin']);
    const statusBefore = ticket.status;
    if (statusBefore === newStatus) {
        throw errors_1.Errors.preconditionFailed('הסטטוס החדש זהה לסטטוס הנוכחי');
    }
    if (statusBefore === 'closed') {
        throw errors_1.Errors.preconditionFailed('לא ניתן לשנות סטטוס של קריאה סגורה');
    }
    const now = (0, firestore_2.serverTimestamp)();
    const ticketUpdate = {
        status: newStatus,
        updatedAt: now,
    };
    if (newStatus === 'resolved')
        ticketUpdate.resolvedAt = now;
    if (newStatus === 'closed') {
        ticketUpdate.closedAt = now;
        if (!ticketUpdate.resolvedAt && !ticket.resolvedAt) {
            ticketUpdate.resolvedAt = now;
        }
    }
    const batch = db.batch();
    // Update ticket
    batch.update(ticketRef, ticketUpdate);
    // Create maintenance update
    const updateRef = db.collection('maintenance_updates').doc();
    batch.set(updateRef, {
        boatId,
        ticketId,
        comment: comment ?? `שינוי סטטוס: ${statusBefore} → ${newStatus}`,
        statusBefore,
        statusAfter: newStatus,
        createdByUserId: uid,
        createdAt: now,
    });
    await batch.commit();
    const auditAction = newStatus === 'closed' ? 'maintenance.closed' : 'maintenance.status_changed';
    await (0, writeAuditLog_1.writeAuditLog)({
        boatId,
        action: auditAction,
        performedByUserId: uid,
        entityType: 'maintenance_ticket',
        entityId: ticketId,
        details: { statusBefore, statusAfter: newStatus },
    });
    return { success: true, updateId: updateRef.id };
});
//# sourceMappingURL=updateMaintenanceStatus.js.map