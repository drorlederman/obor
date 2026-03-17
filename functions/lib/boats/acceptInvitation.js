"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptInvitation = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
const auth_2 = require("../shared/auth");
const errors_1 = require("../shared/errors");
const firestore_2 = require("../shared/firestore");
const claims_1 = require("../shared/claims");
const dates_1 = require("../shared/dates");
const writeAuditLog_1 = require("../audit/writeAuditLog");
exports.acceptInvitation = (0, https_1.onCall)(async (request) => {
    const uid = (0, auth_2.ensureAuthenticated)(request);
    const { token } = request.data;
    if (!token?.trim())
        throw errors_1.Errors.invalidArgument('טוקן ההזמנה הוא שדה חובה');
    const db = (0, firestore_1.getFirestore)();
    // Find invitation by token
    const invSnap = await db
        .collection('invitations')
        .where('token', '==', token.trim())
        .limit(1)
        .get();
    if (invSnap.empty)
        throw errors_1.Errors.notFound('ההזמנה');
    const invDoc = invSnap.docs[0];
    const invitation = invDoc.data();
    // Validate invitation
    if (invitation.status === 'accepted')
        throw errors_1.Errors.invitationAlreadyUsed();
    if (invitation.status === 'cancelled' || invitation.status === 'expired') {
        throw errors_1.Errors.invitationExpired();
    }
    if (invitation.status !== 'pending')
        throw errors_1.Errors.invitationExpired();
    if ((0, dates_1.isExpired)(invitation.expiresAt))
        throw errors_1.Errors.invitationExpired();
    const boatId = invitation.boatId;
    // Check user email matches invitation email (soft check — log if mismatch but allow)
    const authUser = await (0, auth_1.getAuth)().getUser(uid);
    const userEmail = authUser.email?.toLowerCase() ?? '';
    if (userEmail !== invitation.email) {
        throw errors_1.Errors.permissionDenied('כתובת האימייל אינה תואמת להזמנה');
    }
    // Check not already an active member
    const memberRef = db.doc(`boat_members/${uid}_${boatId}`);
    const existingMember = await memberRef.get();
    if (existingMember.exists && existingMember.data()?.status === 'active') {
        throw errors_1.Errors.alreadyExists('הינך כבר חבר פעיל בסירה זו');
    }
    const partnerId = db.collection('partners').doc().id;
    const boatRef = db.doc(`boats/${boatId}`);
    const now = (0, firestore_2.serverTimestamp)();
    // Get user doc for partner info
    let fullName = authUser.displayName ?? '';
    let email = authUser.email ?? '';
    let phone = null;
    try {
        const userDoc = await db.doc(`users/${uid}`).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            fullName = userData.fullName || fullName;
            email = userData.email || email;
            phone = userData.phone ?? null;
        }
    }
    catch {
        // Use auth data as fallback
    }
    await (0, firestore_2.runTransaction)(async (transaction) => {
        // Re-read invitation inside transaction to prevent double acceptance
        const invTransactionSnap = await transaction.get(invDoc.ref);
        if (!invTransactionSnap.exists)
            throw errors_1.Errors.notFound('ההזמנה');
        const invData = invTransactionSnap.data();
        if (invData.status !== 'pending')
            throw errors_1.Errors.invitationAlreadyUsed();
        // Create boat_member
        transaction.set(memberRef, {
            boatId,
            userId: uid,
            partnerId,
            role: invitation.role,
            status: 'active',
            invitedByUserId: invitation.invitedByUserId,
            invitedAt: invitation.createdAt,
            joinedAt: now,
            createdAt: now,
            updatedAt: now,
        });
        // Create partner
        transaction.set(db.doc(`partners/${partnerId}`), {
            boatId,
            userId: uid,
            fullName,
            email,
            phone,
            status: 'active',
            weekdayCreditsBalance: 0,
            weekendCreditsBalance: 0,
            financialStatus: 'active',
            joinedAt: now,
            createdAt: now,
            updatedAt: now,
            notes: null,
        });
        // Update invitation
        transaction.update(invDoc.ref, {
            status: 'accepted',
            acceptedAt: now,
            acceptedByUserId: uid,
        });
        // Increment boat memberCount
        transaction.update(boatRef, {
            memberCount: (0, firestore_2.increment)(1),
            updatedAt: now,
        });
    });
    // Sync Custom Claims (outside transaction)
    await (0, claims_1.syncCustomClaims)(uid);
    await (0, writeAuditLog_1.writeAuditLog)({
        boatId,
        action: 'member.joined',
        performedByUserId: uid,
        entityType: 'boat_member',
        entityId: `${uid}_${boatId}`,
        details: { role: invitation.role, invitationId: invDoc.id },
    });
    return { success: true, boatId, partnerId };
});
//# sourceMappingURL=acceptInvitation.js.map