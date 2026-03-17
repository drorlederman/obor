"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.freezePartner = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../shared/auth");
const errors_1 = require("../shared/errors");
const firestore_2 = require("../shared/firestore");
const writeAuditLog_1 = require("../audit/writeAuditLog");
exports.freezePartner = (0, https_1.onCall)(async (request) => {
    const { boatId, partnerId } = request.data;
    if (!boatId)
        throw errors_1.Errors.invalidArgument('boatId הוא שדה חובה');
    if (!partnerId)
        throw errors_1.Errors.invalidArgument('partnerId הוא שדה חובה');
    const { uid } = await (0, auth_1.ensureRoleIn)(request, boatId, ['treasurer', 'admin']);
    const db = (0, firestore_1.getFirestore)();
    const partnerRef = db.doc(`partners/${partnerId}`);
    const partnerSnap = await partnerRef.get();
    if (!partnerSnap.exists)
        throw errors_1.Errors.notFound('השותף');
    const partner = partnerSnap.data();
    if (partner.boatId !== boatId)
        throw errors_1.Errors.permissionDenied('השותף אינו שייך לסירה זו');
    if (partner.financialStatus === 'frozen') {
        throw errors_1.Errors.preconditionFailed('השותף כבר מוקפא פיננסית');
    }
    await partnerRef.update({
        financialStatus: 'frozen',
        updatedAt: (0, firestore_2.serverTimestamp)(),
    });
    await (0, writeAuditLog_1.writeAuditLog)({
        boatId,
        action: 'member.frozen',
        performedByUserId: uid,
        entityType: 'partner',
        entityId: partnerId,
        details: { partnerId },
    });
    return { success: true };
});
//# sourceMappingURL=freezePartner.js.map