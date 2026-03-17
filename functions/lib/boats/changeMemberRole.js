"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeMemberRole = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../shared/auth");
const errors_1 = require("../shared/errors");
const firestore_2 = require("../shared/firestore");
const claims_1 = require("../shared/claims");
const writeAuditLog_1 = require("../audit/writeAuditLog");
const VALID_ROLES = ['partner', 'scheduler', 'treasurer', 'maintenanceManager', 'admin'];
exports.changeMemberRole = (0, https_1.onCall)(async (request) => {
    const { boatId, userId: targetUserId, newRole } = request.data;
    if (!boatId)
        throw errors_1.Errors.invalidArgument('boatId הוא שדה חובה');
    if (!targetUserId)
        throw errors_1.Errors.invalidArgument('userId הוא שדה חובה');
    if (!VALID_ROLES.includes(newRole))
        throw errors_1.Errors.invalidArgument('תפקיד לא תקין');
    const { uid } = await (0, auth_1.ensureAdmin)(request, boatId);
    const db = (0, firestore_1.getFirestore)();
    const memberRef = db.doc(`boat_members/${targetUserId}_${boatId}`);
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists)
        throw errors_1.Errors.membershipNotFound();
    const memberData = memberSnap.data();
    if (memberData.status === 'removed') {
        throw errors_1.Errors.preconditionFailed('לא ניתן לשנות תפקיד לשותף שהוסר');
    }
    const currentRole = memberData.role;
    // If demoting an admin, ensure it's not the last one
    if (currentRole === 'admin' && newRole !== 'admin') {
        const adminSnap = await db
            .collection('boat_members')
            .where('boatId', '==', boatId)
            .where('role', '==', 'admin')
            .where('status', '==', 'active')
            .get();
        if (adminSnap.size <= 1) {
            throw errors_1.Errors.preconditionFailed('לא ניתן להוריד את המנהל האחרון של הסירה');
        }
    }
    if (currentRole === newRole) {
        throw errors_1.Errors.preconditionFailed('התפקיד החדש זהה לתפקיד הנוכחי');
    }
    await memberRef.update({
        role: newRole,
        updatedAt: (0, firestore_2.serverTimestamp)(),
    });
    // Sync Custom Claims
    await (0, claims_1.updateCustomClaims)(targetUserId, boatId, {
        role: newRole,
        status: memberData.status,
    });
    await (0, writeAuditLog_1.writeAuditLog)({
        boatId,
        action: 'member.role_changed',
        performedByUserId: uid,
        entityType: 'boat_member',
        entityId: `${targetUserId}_${boatId}`,
        details: { targetUserId, previousRole: currentRole, newRole },
    });
    return { success: true };
});
//# sourceMappingURL=changeMemberRole.js.map