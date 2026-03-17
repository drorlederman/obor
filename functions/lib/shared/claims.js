"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncCustomClaims = syncCustomClaims;
exports.updateCustomClaims = updateCustomClaims;
exports.removeFromCustomClaims = removeFromCustomClaims;
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
/**
 * Syncs Custom Claims for a user by reading all their boat_members documents.
 * Call this after any membership change.
 */
async function syncCustomClaims(userId) {
    const db = (0, firestore_1.getFirestore)();
    const auth = (0, auth_1.getAuth)();
    const membershipsSnap = await db
        .collection('boat_members')
        .where('userId', '==', userId)
        .get();
    const memberships = {};
    for (const doc of membershipsSnap.docs) {
        const data = doc.data();
        const boatId = data.boatId;
        // Get boat name for UI display
        let boatName;
        try {
            const boatDoc = await db.doc(`boats/${boatId}`).get();
            boatName = boatDoc.data()?.name;
        }
        catch {
            // Non-critical
        }
        memberships[boatId] = {
            role: data.role,
            status: data.status,
            boatName,
        };
    }
    await auth.setCustomUserClaims(userId, { memberships });
}
/**
 * Adds or updates a single boat membership in Custom Claims.
 * More efficient than full sync when only one boat changes.
 */
async function updateCustomClaims(userId, boatId, membership) {
    const auth = (0, auth_1.getAuth)();
    const user = await auth.getUser(userId);
    const existing = (user.customClaims ?? {});
    const currentMemberships = existing.memberships ?? {};
    await auth.setCustomUserClaims(userId, {
        memberships: {
            ...currentMemberships,
            [boatId]: membership,
        },
    });
}
/**
 * Removes a boat from a user's Custom Claims.
 */
async function removeFromCustomClaims(userId, boatId) {
    const auth = (0, auth_1.getAuth)();
    const user = await auth.getUser(userId);
    const existing = (user.customClaims ?? {});
    const currentMemberships = { ...(existing.memberships ?? {}) };
    delete currentMemberships[boatId];
    await auth.setCustomUserClaims(userId, { memberships: currentMemberships });
}
//# sourceMappingURL=claims.js.map