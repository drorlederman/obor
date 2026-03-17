"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBoat = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
const auth_2 = require("../shared/auth");
const errors_1 = require("../shared/errors");
const firestore_2 = require("../shared/firestore");
const claims_1 = require("../shared/claims");
const writeAuditLog_1 = require("../audit/writeAuditLog");
exports.createBoat = (0, https_1.onCall)(async (request) => {
    const uid = (0, auth_2.ensureAuthenticated)(request);
    const { name, code, homeMarina = null } = request.data;
    if (!name?.trim())
        throw errors_1.Errors.invalidArgument('שם הסירה הוא שדה חובה');
    if (!code?.trim())
        throw errors_1.Errors.invalidArgument('קוד הסירה הוא שדה חובה');
    const db = (0, firestore_1.getFirestore)();
    // Check code uniqueness
    const codeSnap = await db.collection('boats').where('code', '==', code.trim()).get();
    if (!codeSnap.empty)
        throw errors_1.Errors.alreadyExists('קוד הסירה');
    // Get user profile for partner name
    let fullName = '';
    let email = '';
    let phone = null;
    try {
        const userDoc = await db.doc(`users/${uid}`).get();
        const userData = userDoc.data() ?? {};
        fullName = userData.fullName ?? '';
        email = userData.email ?? '';
        phone = userData.phone ?? null;
    }
    catch {
        // If user doc doesn't exist yet, fall back to auth
        const authUser = await (0, auth_1.getAuth)().getUser(uid);
        email = authUser.email ?? '';
        fullName = authUser.displayName ?? '';
    }
    const boatRef = db.collection('boats').doc();
    const boatId = boatRef.id;
    const partnerRef = db.collection('partners').doc();
    const partnerId = partnerRef.id;
    const now = (0, firestore_2.serverTimestamp)();
    const batch = db.batch();
    // Boat
    batch.set(boatRef, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        status: 'active',
        homeMarina: homeMarina ?? null,
        ownerUserId: uid,
        memberCount: 1,
        createdAt: now,
        updatedAt: now,
    });
    // boat_members
    batch.set(db.doc(`boat_members/${uid}_${boatId}`), {
        boatId,
        userId: uid,
        partnerId,
        role: 'admin',
        status: 'active',
        invitedByUserId: null,
        invitedAt: null,
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
    });
    // partners
    batch.set(partnerRef, {
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
    // system_settings (3 docs)
    batch.set(db.doc(`system_settings/${boatId}_credits`), {
        boatId,
        type: 'credits',
        dayCreditCost: 1,
        weekendCreditCost: 2,
        updatedAt: now,
    });
    batch.set(db.doc(`system_settings/${boatId}_notifications`), {
        boatId,
        type: 'notifications',
        paymentReminderDays: 7,
        announcements: true,
        maintenance: true,
        invoices: true,
        bookingReminders: true,
        updatedAt: now,
    });
    batch.set(db.doc(`system_settings/${boatId}_weather`), {
        boatId,
        type: 'weather',
        locationLat: null,
        locationLng: null,
        updatedAt: now,
    });
    await batch.commit();
    // Update Custom Claims
    await (0, claims_1.updateCustomClaims)(uid, boatId, { role: 'admin', status: 'active', boatName: name.trim() });
    // Audit log
    await (0, writeAuditLog_1.writeAuditLog)({
        boatId,
        action: 'boat.created',
        performedByUserId: uid,
        entityType: 'boat',
        entityId: boatId,
        details: { name: name.trim(), code: code.trim().toUpperCase() },
    });
    return { success: true, boatId, partnerId };
});
//# sourceMappingURL=createBoat.js.map