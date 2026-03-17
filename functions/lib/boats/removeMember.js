"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMember = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../shared/auth");
const errors_1 = require("../shared/errors");
const firestore_2 = require("../shared/firestore");
const claims_1 = require("../shared/claims");
const writeAuditLog_1 = require("../audit/writeAuditLog");
exports.removeMember = (0, https_1.onCall)(async (request) => {
    const { boatId, userId: targetUserId } = request.data;
    if (!boatId)
        throw errors_1.Errors.invalidArgument('boatId הוא שדה חובה');
    if (!targetUserId)
        throw errors_1.Errors.invalidArgument('userId הוא שדה חובה');
    const { uid } = await (0, auth_1.ensureAdmin)(request, boatId);
    const db = (0, firestore_1.getFirestore)();
    const memberRef = db.doc(`boat_members/${targetUserId}_${boatId}`);
    const boatRef = db.doc(`boats/${boatId}`);
    // Load target member
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists)
        throw errors_1.Errors.membershipNotFound();
    const memberData = memberSnap.data();
    if (memberData.status === 'removed') {
        throw errors_1.Errors.preconditionFailed('השותף כבר הוסר');
    }
    // Prevent removing the last admin
    if (memberData.role === 'admin') {
        const adminSnap = await db
            .collection('boat_members')
            .where('boatId', '==', boatId)
            .where('role', '==', 'admin')
            .where('status', '==', 'active')
            .get();
        if (adminSnap.size <= 1) {
            throw errors_1.Errors.preconditionFailed('לא ניתן להסיר את המנהל האחרון של הסירה');
        }
    }
    // Find partner document
    const partnerSnap = await db
        .collection('partners')
        .where('boatId', '==', boatId)
        .where('userId', '==', targetUserId)
        .limit(1)
        .get();
    await (0, firestore_2.runTransaction)(async (transaction) => {
        // Update boat_member
        transaction.update(memberRef, {
            status: 'removed',
            updatedAt: (0, firestore_2.serverTimestamp)(),
        });
        // Update partner if exists
        if (!partnerSnap.empty) {
            transaction.update(partnerSnap.docs[0].ref, {
                status: 'removed',
                updatedAt: (0, firestore_2.serverTimestamp)(),
            });
        }
        // Decrement memberCount
        transaction.update(boatRef, {
            memberCount: (0, firestore_2.increment)(-1),
            updatedAt: (0, firestore_2.serverTimestamp)(),
        });
    });
    // Remove from Custom Claims (outside transaction)
    await (0, claims_1.removeFromCustomClaims)(targetUserId, boatId);
    await (0, writeAuditLog_1.writeAuditLog)({
        boatId,
        action: 'member.removed',
        performedByUserId: uid,
        entityType: 'boat_member',
        entityId: `${targetUserId}_${boatId}`,
        details: { removedUserId: targetUserId },
    });
    return { success: true };
});
//# sourceMappingURL=removeMember.js.map