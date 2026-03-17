"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeInvitation = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../shared/auth");
const errors_1 = require("../shared/errors");
const firestore_2 = require("../shared/firestore");
const writeAuditLog_1 = require("../audit/writeAuditLog");
exports.revokeInvitation = (0, https_1.onCall)(async (request) => {
    const { invitationId } = request.data;
    if (!invitationId?.trim())
        throw errors_1.Errors.invalidArgument('מזהה ההזמנה הוא שדה חובה');
    const db = (0, firestore_1.getFirestore)();
    const invRef = db.doc(`invitations/${invitationId}`);
    const invitation = await (0, firestore_2.getDocOrThrow)(invRef, 'ההזמנה');
    const { uid } = await (0, auth_1.ensureAdmin)(request, invitation.boatId);
    if (invitation.status !== 'pending') {
        throw errors_1.Errors.preconditionFailed('ניתן לבטל רק הזמנות בסטטוס ממתין');
    }
    await invRef.update({
        status: 'cancelled',
        updatedAt: (0, firestore_2.serverTimestamp)(),
    });
    await (0, writeAuditLog_1.writeAuditLog)({
        boatId: invitation.boatId,
        action: 'invitation.revoked',
        performedByUserId: uid,
        entityType: 'invitation',
        entityId: invitationId,
        details: { email: invitation.email, role: invitation.role },
    });
    return { success: true };
});
//# sourceMappingURL=revokeInvitation.js.map