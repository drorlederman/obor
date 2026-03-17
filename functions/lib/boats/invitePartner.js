"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitePartner = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
const auth_2 = require("../shared/auth");
const errors_1 = require("../shared/errors");
const firestore_2 = require("../shared/firestore");
const dates_1 = require("../shared/dates");
const writeAuditLog_1 = require("../audit/writeAuditLog");
const crypto_1 = require("crypto");
const email_1 = require("../shared/email");
const VALID_ROLES = ['partner', 'scheduler', 'treasurer', 'maintenanceManager', 'admin'];
exports.invitePartner = (0, https_1.onCall)(async (request) => {
    const { boatId, email, role } = request.data;
    if (!boatId)
        throw errors_1.Errors.invalidArgument('boatId הוא שדה חובה');
    if (!email?.trim())
        throw errors_1.Errors.invalidArgument('כתובת אימייל היא שדה חובה');
    if (!VALID_ROLES.includes(role))
        throw errors_1.Errors.invalidArgument('תפקיד לא תקין');
    const { uid } = await (0, auth_2.ensureAdmin)(request, boatId);
    const db = (0, firestore_1.getFirestore)();
    const normalizedEmail = email.trim().toLowerCase();
    // Check if user with this email already exists and is an active member
    try {
        const existingUser = await (0, auth_1.getAuth)().getUserByEmail(normalizedEmail);
        const memberDoc = await db.doc(`boat_members/${existingUser.uid}_${boatId}`).get();
        if (memberDoc.exists) {
            const memberData = memberDoc.data();
            if (memberData.status === 'active') {
                throw errors_1.Errors.alreadyExists('שותף עם אימייל זה כבר חבר פעיל בסירה');
            }
        }
    }
    catch (err) {
        // User doesn't exist in Auth yet — invitation is still valid
        if (err instanceof Error && err.message?.includes('There is no user record')) {
            // Fine — user will sign up later
        }
        else {
            const isHttpsError = err !== null && typeof err === 'object' && 'code' in err;
            if (isHttpsError)
                throw err; // Re-throw our own errors
        }
    }
    // Check for pending invitation for this email+boat
    const pendingSnap = await db
        .collection('invitations')
        .where('boatId', '==', boatId)
        .where('email', '==', normalizedEmail)
        .where('status', '==', 'pending')
        .get();
    if (!pendingSnap.empty) {
        throw errors_1.Errors.alreadyExists('קיימת הזמנה פעילה לאימייל זה');
    }
    // Get boat name for the invitation
    const boatDoc = await db.doc(`boats/${boatId}`).get();
    if (!boatDoc.exists)
        throw errors_1.Errors.boatNotFound();
    const boatName = boatDoc.data().name ?? '';
    const token = (0, crypto_1.randomUUID)();
    const invitationRef = db.collection('invitations').doc();
    await invitationRef.set({
        boatId,
        boatName,
        email: normalizedEmail,
        role,
        token,
        status: 'pending',
        invitedByUserId: uid,
        createdAt: (0, firestore_2.serverTimestamp)(),
        expiresAt: (0, dates_1.daysFromNow)(7),
        acceptedAt: null,
        acceptedByUserId: null,
    });
    await (0, writeAuditLog_1.writeAuditLog)({
        boatId,
        action: 'member.invited',
        performedByUserId: uid,
        entityType: 'invitation',
        entityId: invitationRef.id,
        details: { email: normalizedEmail, role },
    });
    // Send invitation email (non-blocking — don't fail if email fails)
    (0, email_1.sendInvitationEmail)(normalizedEmail, boatName, token).catch((err) => console.error('sendInvitationEmail failed:', err));
    return { success: true, invitationId: invitationRef.id, token };
});
//# sourceMappingURL=invitePartner.js.map