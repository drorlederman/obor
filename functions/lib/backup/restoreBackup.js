"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreBackup = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
const auth_1 = require("../shared/auth");
const errors_1 = require("../shared/errors");
const writeAuditLog_1 = require("../audit/writeAuditLog");
const BATCH_SIZE = 499; // Firestore batch limit is 500
exports.restoreBackup = (0, https_1.onCall)(async (request) => {
    const { backupId, confirm } = request.data;
    if (!backupId)
        throw errors_1.Errors.invalidArgument('backupId הוא שדה חובה');
    if (confirm !== true) {
        throw errors_1.Errors.preconditionFailed('יש לאשר את השחזור במפורש (confirm: true)');
    }
    const db = (0, firestore_1.getFirestore)();
    const backupRef = db.doc(`backups/${backupId}`);
    const backupSnap = await backupRef.get();
    if (!backupSnap.exists)
        throw errors_1.Errors.notFound('הגיבוי');
    const backupMeta = backupSnap.data();
    const boatId = backupMeta.boatId;
    const { uid } = await (0, auth_1.ensureAdmin)(request, boatId);
    const storagePath = backupMeta.storagePath;
    // Download backup from Storage
    let backupPayload;
    try {
        const bucket = (0, storage_1.getStorage)().bucket();
        const file = bucket.file(storagePath);
        const [contents] = await file.download();
        backupPayload = JSON.parse(contents.toString('utf-8'));
    }
    catch {
        throw errors_1.Errors.internal('שגיאה בטעינת קובץ הגיבוי מהאחסון');
    }
    if (backupPayload.boatId !== boatId) {
        throw errors_1.Errors.permissionDenied('הגיבוי אינו שייך לסירה זו');
    }
    const allCollections = backupPayload.data;
    let totalRestored = 0;
    // Restore each collection in batches
    for (const [collectionName, documents] of Object.entries(allCollections)) {
        if (!Array.isArray(documents) || documents.length === 0)
            continue;
        // Skip the boats collection — don't overwrite boat root
        if (collectionName === 'boats')
            continue;
        // Process in batches
        for (let i = 0; i < documents.length; i += BATCH_SIZE) {
            const chunk = documents.slice(i, i + BATCH_SIZE);
            const batch = db.batch();
            for (const doc of chunk) {
                const { _id, ...data } = doc;
                if (!_id)
                    continue;
                const docRef = db.collection(collectionName).doc(_id);
                batch.set(docRef, data, { merge: false });
                totalRestored++;
            }
            await batch.commit();
        }
    }
    await (0, writeAuditLog_1.writeAuditLog)({
        boatId,
        action: 'backup.restored',
        performedByUserId: uid,
        entityType: 'backup',
        entityId: backupId,
        details: { totalRestored, storagePath },
    });
    return { success: true, totalRestored };
});
//# sourceMappingURL=restoreBackup.js.map