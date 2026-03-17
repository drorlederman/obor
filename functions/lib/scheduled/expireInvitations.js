"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expireInvitations = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
exports.expireInvitations = (0, scheduler_1.onSchedule)('every 24 hours', async () => {
    const db = (0, firestore_1.getFirestore)();
    const now = firestore_1.Timestamp.now();
    const snap = await db
        .collection('invitations')
        .where('status', '==', 'pending')
        .where('expiresAt', '<', now)
        .get();
    if (snap.empty)
        return;
    const BATCH_SIZE = 499;
    let processed = 0;
    for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
        const chunk = snap.docs.slice(i, i + BATCH_SIZE);
        const batch = db.batch();
        for (const doc of chunk) {
            batch.update(doc.ref, { status: 'expired' });
            processed++;
        }
        await batch.commit();
    }
    console.log(`expireInvitations: expired ${processed} invitations`);
});
//# sourceMappingURL=expireInvitations.js.map