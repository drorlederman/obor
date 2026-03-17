"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushToUsers = sendPushToUsers;
exports.sendPushToBoatMembers = sendPushToBoatMembers;
/**
 * FCM push notification utility.
 * Reads FCM tokens from the `user_tokens` collection and sends via Firebase Messaging.
 *
 * Token structure: user_tokens/{userId} = { tokens: string[], updatedAt: Timestamp }
 */
const firestore_1 = require("firebase-admin/firestore");
const messaging_1 = require("firebase-admin/messaging");
/** Send a push notification to specific user IDs. Silently skips users with no tokens. */
async function sendPushToUsers(userIds, notification) {
    if (userIds.length === 0)
        return;
    const db = (0, firestore_1.getFirestore)();
    const messaging = (0, messaging_1.getMessaging)();
    // Collect all FCM tokens for given users
    const tokens = [];
    await Promise.all(userIds.map(async (uid) => {
        const snap = await db.doc(`user_tokens/${uid}`).get();
        if (snap.exists) {
            const data = snap.data();
            const userTokens = data.tokens ?? [];
            tokens.push(...userTokens);
        }
    }));
    if (tokens.length === 0)
        return;
    // Send in batches of 500 (FCM limit)
    const BATCH_SIZE = 500;
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batch = tokens.slice(i, i + BATCH_SIZE);
        await messaging.sendEachForMulticast({
            tokens: batch,
            notification: {
                title: notification.title,
                body: notification.body,
            },
            data: notification.data,
            android: { priority: 'high' },
            apns: { payload: { aps: { contentAvailable: true, sound: 'default' } } },
        });
    }
}
/** Send a push notification to all active members of a boat (except optionally the sender). */
async function sendPushToBoatMembers(boatId, notification, excludeUserId) {
    const db = (0, firestore_1.getFirestore)();
    const membersSnap = await db
        .collection('boat_members')
        .where('boatId', '==', boatId)
        .where('status', '==', 'active')
        .get();
    const userIds = membersSnap.docs
        .map((d) => d.data().userId)
        .filter((uid) => uid && uid !== excludeUserId);
    await sendPushToUsers(userIds, notification);
}
//# sourceMappingURL=notifications.js.map