"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Errors = void 0;
exports.createError = createError;
const https_1 = require("firebase-functions/v2/https");
function createError(code, hebrewMessage) {
    return new https_1.HttpsError(code, hebrewMessage);
}
exports.Errors = {
    unauthenticated: () => createError('unauthenticated', 'יש להתחבר כדי לבצע פעולה זו'),
    permissionDenied: (reason = 'אין לך הרשאה לבצע פעולה זו') => createError('permission-denied', reason),
    notFound: (entity = 'הפריט') => createError('not-found', `${entity} לא נמצא`),
    alreadyExists: (entity = 'הפריט') => createError('already-exists', `${entity} כבר קיים`),
    invalidArgument: (reason) => createError('invalid-argument', reason),
    preconditionFailed: (reason) => createError('failed-precondition', reason),
    internal: (reason = 'שגיאה פנימית, אנא נסה שוב') => createError('internal', reason),
    frozenPartner: () => createError('permission-denied', 'החשבון מוקפא. פנה למנהל הסירה.'),
    boatNotFound: () => createError('not-found', 'הסירה לא נמצאה'),
    membershipNotFound: () => createError('not-found', 'לא נמצאה חברות פעילה בסירה'),
    insufficientCredits: () => createError('failed-precondition', 'אין מספיק מטבעות לביצוע הפעולה'),
    bookingOverlap: () => createError('failed-precondition', 'קיימת הזמנה חופפת בתאריכים אלה'),
    invitationExpired: () => createError('failed-precondition', 'ההזמנה פגת תוקף'),
    invitationAlreadyUsed: () => createError('failed-precondition', 'ההזמנה כבר נוצלה'),
};
//# sourceMappingURL=errors.js.map