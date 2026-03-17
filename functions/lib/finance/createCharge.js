"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCharge = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../shared/auth");
const errors_1 = require("../shared/errors");
const firestore_2 = require("../shared/firestore");
const dates_1 = require("../shared/dates");
const writeAuditLog_1 = require("../audit/writeAuditLog");
const VALID_CATEGORIES = ['maintenance', 'marina', 'insurance', 'equipment', 'general'];
exports.createCharge = (0, https_1.onCall)(async (request) => {
    const { boatId, title, description = null, category, totalAmount, dueDate } = request.data;
    if (!boatId)
        throw errors_1.Errors.invalidArgument('boatId הוא שדה חובה');
    if (!title?.trim())
        throw errors_1.Errors.invalidArgument('כותרת החיוב היא שדה חובה');
    if (!VALID_CATEGORIES.includes(category))
        throw errors_1.Errors.invalidArgument('קטגוריה לא תקינה');
    if (!totalAmount || totalAmount <= 0)
        throw errors_1.Errors.invalidArgument('סכום החיוב חייב להיות מספר חיובי');
    if (!dueDate)
        throw errors_1.Errors.invalidArgument('תאריך פירעון הוא שדה חובה');
    const { uid } = await (0, auth_1.ensureRoleIn)(request, boatId, ['treasurer', 'admin']);
    const db = (0, firestore_1.getFirestore)();
    const chargeRef = db.collection('charges').doc();
    await chargeRef.set({
        boatId,
        title: title.trim(),
        description: description ?? null,
        category,
        totalAmount,
        splitMethod: 'equal',
        dueDate: (0, dates_1.toTimestamp)(dueDate),
        status: 'draft',
        createdByUserId: uid,
        createdAt: (0, firestore_2.serverTimestamp)(),
        updatedAt: (0, firestore_2.serverTimestamp)(),
    });
    await (0, writeAuditLog_1.writeAuditLog)({
        boatId,
        action: 'charge.created',
        performedByUserId: uid,
        entityType: 'charge',
        entityId: chargeRef.id,
        details: { title: title.trim(), totalAmount, category },
    });
    return { success: true, chargeId: chargeRef.id };
});
//# sourceMappingURL=createCharge.js.map