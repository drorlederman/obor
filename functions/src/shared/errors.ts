import { HttpsError } from 'firebase-functions/v2/https'

export type FunctionsErrorCode =
  | 'unauthenticated'
  | 'permission-denied'
  | 'not-found'
  | 'already-exists'
  | 'invalid-argument'
  | 'failed-precondition'
  | 'internal'

export function createError(code: FunctionsErrorCode, hebrewMessage: string): HttpsError {
  return new HttpsError(code, hebrewMessage)
}

export const Errors = {
  unauthenticated: () =>
    createError('unauthenticated', 'יש להתחבר כדי לבצע פעולה זו'),

  permissionDenied: (reason = 'אין לך הרשאה לבצע פעולה זו') =>
    createError('permission-denied', reason),

  notFound: (entity = 'הפריט') =>
    createError('not-found', `${entity} לא נמצא`),

  alreadyExists: (entity = 'הפריט') =>
    createError('already-exists', `${entity} כבר קיים`),

  invalidArgument: (reason: string) =>
    createError('invalid-argument', reason),

  preconditionFailed: (reason: string) =>
    createError('failed-precondition', reason),

  internal: (reason = 'שגיאה פנימית, אנא נסה שוב') =>
    createError('internal', reason),

  frozenPartner: () =>
    createError('permission-denied', 'החשבון מוקפא. פנה למנהל הסירה.'),

  boatNotFound: () =>
    createError('not-found', 'הסירה לא נמצאה'),

  membershipNotFound: () =>
    createError('not-found', 'לא נמצאה חברות פעילה בסירה'),

  insufficientCredits: () =>
    createError('failed-precondition', 'אין מספיק מטבעות לביצוע הפעולה'),

  bookingOverlap: () =>
    createError('failed-precondition', 'קיימת הזמנה חופפת בתאריכים אלה'),

  invitationExpired: () =>
    createError('failed-precondition', 'ההזמנה פגת תוקף'),

  invitationAlreadyUsed: () =>
    createError('failed-precondition', 'ההזמנה כבר נוצלה'),
}
