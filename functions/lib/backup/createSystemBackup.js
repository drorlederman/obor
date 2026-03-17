"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSystemBackup = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
const auth_1 = require("../shared/auth");
const errors_1 = require("../shared/errors");
const firestore_2 = require("../shared/firestore");
const writeAuditLog_1 = require("../audit/writeAuditLog");
const BOAT_COLLECTIONS = [
    'bookings',
    'credit_transactions',
    'charges',
    'partner_invoices',
    'payments',
    'maintenance_tickets',
    'maintenance_updates',
    'maintenance_attachments',
    'announcements',
    'checklists',
    'checklist_runs',
    'contacts',
    'feedback_reports',
    'system_settings',
    'partners',
    'invitations',
];
exports.createSystemBackup = (0, https_1.onCall)(async (request) => {
    const { boatId, notes = null } = request.data;
    if (!boatId)
        throw errors_1.Errors.invalidArgument('boatId הוא שדה חובה');
    const { uid } = await (0, auth_1.ensureAdmin)(request, boatId);
    const db = (0, firestore_1.getFirestore)();
    // Export all boat-scoped data
    const backupData = {};
    let totalDocuments = 0;
    for (const collectionName of BOAT_COLLECTIONS) {
        try {
            const snap = await db
                .collection(collectionName)
                .where('boatId', '==', boatId)
                .get();
            backupData[collectionName] = snap.docs.map((doc) => ({
                _id: doc.id,
                ...doc.data(),
            }));
            totalDocuments += snap.size;
        }
        catch {
            backupData[collectionName] = [];
        }
    }
    // Also export boat_members (uses compound doc ID, not boatId field but does have boatId)
    try {
        const membersSnap = await db
            .collection('boat_members')
            .where('boatId', '==', boatId)
            .get();
        backupData['boat_members'] = membersSnap.docs.map((doc) => ({
            _id: doc.id,
            ...doc.data(),
        }));
        totalDocuments += membersSnap.size;
    }
    catch {
        backupData['boat_members'] = [];
    }
    // Get boat metadata
    const boatDoc = await db.doc(`boats/${boatId}`).get();
    if (boatDoc.exists) {
        backupData['boats'] = [{ _id: boatId, ...boatDoc.data() }];
        totalDocuments += 1;
    }
    const backupPayload = {
        boatId,
        exportedAt: new Date().toISOString(),
        totalDocuments,
        collections: Object.keys(backupData),
        data: backupData,
    };
    // Upload to Firebase Storage
    const backupRef = db.collection('backups').doc();
    const backupId = backupRef.id;
    const storagePath = `boats/${boatId}/backups/${backupId}.json`;
    try {
        const bucket = (0, storage_1.getStorage)().bucket();
        const file = bucket.file(storagePath);
        await file.save(JSON.stringify(backupPayload, null, 2), {
            contentType: 'application/json',
            metadata: {
                boatId,
                backupId,
                createdByUserId: uid,
            },
        });
    }
    catch (err) {
        throw errors_1.Errors.internal('שגיאה בשמירת הגיבוי לאחסון');
    }
    // Create backup metadata
    await backupRef.set({
        boatId,
        storagePath,
        notes: notes ?? null,
        totalDocuments,
        collections: Object.keys(backupData),
        status: 'completed',
        createdByUserId: uid,
        createdAt: (0, firestore_2.serverTimestamp)(),
    });
    await (0, writeAuditLog_1.writeAuditLog)({
        boatId,
        action: 'backup.created',
        performedByUserId: uid,
        entityType: 'backup',
        entityId: backupId,
        details: { totalDocuments, storagePath },
    });
    return { success: true, backupId, totalDocuments };
});
//# sourceMappingURL=createSystemBackup.js.map