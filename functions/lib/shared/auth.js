"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAuthenticated = ensureAuthenticated;
exports.ensureActiveMemberOf = ensureActiveMemberOf;
exports.ensureRoleIn = ensureRoleIn;
exports.ensureAdmin = ensureAdmin;
const firestore_1 = require("firebase-admin/firestore");
const errors_1 = require("./errors");
/**
 * Ensures the request is authenticated. Returns the uid.
 */
function ensureAuthenticated(request) {
    if (!request.auth?.uid) {
        throw errors_1.Errors.unauthenticated();
    }
    return request.auth.uid;
}
/**
 * Ensures the authenticated user is an active member of the given boat.
 * Checks Custom Claims first (fast path), falls back to Firestore (slow path).
 */
async function ensureActiveMemberOf(request, boatId) {
    const uid = ensureAuthenticated(request);
    // Fast path: check Custom Claims
    const claims = request.auth.token;
    const claimMembership = claims.memberships?.[boatId];
    if (claimMembership?.status === 'active') {
        return { uid, role: claimMembership.role };
    }
    // Slow path: fallback to Firestore (handles stale tokens)
    const db = (0, firestore_1.getFirestore)();
    const memberDoc = await db.doc(`boat_members/${uid}_${boatId}`).get();
    if (!memberDoc.exists) {
        throw errors_1.Errors.permissionDenied('אינך חבר בסירה זו');
    }
    const data = memberDoc.data();
    if (data.status !== 'active') {
        throw errors_1.Errors.frozenPartner();
    }
    return { uid, role: data.role };
}
/**
 * Ensures the user has one of the specified roles in the boat.
 */
async function ensureRoleIn(request, boatId, allowedRoles) {
    const membership = await ensureActiveMemberOf(request, boatId);
    if (!allowedRoles.includes(membership.role)) {
        throw errors_1.Errors.permissionDenied();
    }
    return membership;
}
/**
 * Ensures the user is an admin of the given boat.
 */
async function ensureAdmin(request, boatId) {
    return ensureRoleIn(request, boatId, ['admin']);
}
//# sourceMappingURL=auth.js.map