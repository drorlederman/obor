# Security Rules Strategy

מסמך זה מגדיר את אסטרטגיית ה-Firestore Security Rules עבור פרויקט OBOR.

---

# Core Design Philosophy

## Client vs. Cloud Functions

ב-OBOR, **Cloud Functions** עובדות עם Firebase Admin SDK שעוקף את Security Rules לחלוטין.

לכן, ה-Security Rules מגנות רק מפני **גישה ישירה של ה-client SDK** ל-Firestore.

> אם פעולה מגיעה מ-Cloud Function — ה-rules אינן נדרשות.
> אם פעולה מגיעה ישירות מה-client — ה-rules הן קו ההגנה.

## מה Rules עושות

✅ מאפשרות reads לפי חברות בסירה (`boatId`)
✅ מאפשרות writes ישירות לשדות לא-רגישים
❌ חוסמות writes לנתונים רגישים (credits, invoices, payments, bookings)
❌ חוסמות גישה בין סירות שונות

---

# Authentication Baseline

```javascript
function isAuthenticated() {
  return request.auth != null;
}
```

משתמש לא מחובר — חסום מלא.

---

# Role Retrieval Strategy — Custom Claims (per-boat)

## הבעיה

בשיטת multi-tenant, למשתמש יש תפקיד **per-boat**, לא תפקיד גלובלי.

## הפתרון — memberships map ב-Custom Claims

כאשר `boat_members` משתנה, Cloud Function מעדכנת את ה-Custom Claims:

```javascript
await admin.auth().setCustomUserClaims(uid, {
  memberships: {
    "boatId_A": { role: "admin",   status: "active" },
    "boatId_B": { role: "partner", status: "active" }
  }
});
```

### Helper Functions

```javascript
function getMembership(boatId) {
  return request.auth.token.memberships != null
    ? request.auth.token.memberships[boatId]
    : null;
}

function isMemberOf(boatId) {
  return isAuthenticated() && getMembership(boatId) != null;
}

function getRoleIn(boatId) {
  let m = getMembership(boatId);
  return m != null ? m.role : null;
}

function getStatusIn(boatId) {
  let m = getMembership(boatId);
  return m != null ? m.status : null;
}

function isActiveIn(boatId) {
  return isMemberOf(boatId) && getStatusIn(boatId) == 'active';
}

function hasRoleIn(boatId, role) {
  return isActiveIn(boatId) && getRoleIn(boatId) == role;
}

function hasAnyRoleIn(boatId, roles) {
  return isActiveIn(boatId) && getRoleIn(boatId) in roles;
}

function isAdminOf(boatId) {
  return hasRoleIn(boatId, 'admin');
}
```

### Custom Claims מוגבלות ל-1000 bytes

עבור אפליקציית שיתוף סירה, משתמש נמצא בממוצע ב-1-2 סירות. הגבלה זו אינה בעיה מעשית.

---

# Collection-Level Rules

## 1. users

```
reads:
  - עצמי: uid == request.auth.uid
  - admin של כל סירה שהמשתמש חבר בה: isAdminOf(anyBoatId) [פחות נפוץ]
writes:
  - עצמי, שדות מוגבלים: fullName, phone
  - אסור לשנות: createdAt, lastLoginAt
```

---

## 2. boats

```
reads:
  - כל member פעיל: isMemberOf(boatId)
writes:
  - יצירה: כל user מחובר (createBoat דרך Cloud Function)
  - עדכון: admin של הסירה
  - אסור ישירות: ownerUserId, memberCount
```

---

## 3. boat_members

```
reads:
  - member פעיל בסירה: isActiveIn(boatId)
writes:
  - אסור לחלוטין ישירות מה-client
  - מנוהל רק דרך Cloud Functions: createBoat, acceptInvitation, removeMember, changeMemberRole
```

---

## 4. partners

```
reads:
  - כל member פעיל בסירה: isActiveIn(resource.data.boatId)
writes:
  - שדות קשר (fullName, phone, notes): member עצמו אם partnerId == שלו
  - credits, financialStatus, status: אסור ישירות — Cloud Functions בלבד
```

---

## 5. invitations

```
reads:
  - lookup לפי token: כל user מחובר (לצורך הצטרפות)
  - רשימת הזמנות: admin של הסירה בלבד
writes:
  - יצירה: admin דרך Cloud Function (invitePartner)
  - ביטול: admin דרך Cloud Function
  - קבלה: Cloud Function בלבד (acceptInvitation)
```

---

## 6. bookings

```
reads:
  - כל member פעיל בסירה: isActiveIn(resource.data.boatId)
writes:
  - אסור לחלוטין ישירות מה-client
  - יצירה, עדכון, ביטול — דרך Cloud Functions בלבד
```

---

## 7. credit_transactions

```
reads:
  - partner: resource.data.boatId בסירה שלו + resource.data.partnerId == שלו
  - treasurer / admin: isActiveIn(boatId)
writes:
  - אסור לחלוטין ישירות מה-client
```

---

## 8. charges

```
reads:
  - כל member פעיל: isActiveIn(resource.data.boatId)
writes:
  - treasurer / admin: דרך Cloud Functions
```

---

## 9. partner_invoices

```
reads:
  - partner: רק החשבוניות שלו (partnerId == שלו + boatId נכון)
  - treasurer / admin: כל החשבוניות בסירה
writes:
  - אסור ישירות מה-client
```

---

## 10. payments

```
reads:
  - partner: רק התשלומים שלו
  - treasurer / admin: כל התשלומים בסירה
writes:
  - אסור ישירות מה-client
```

---

## 11. maintenance_tickets

```
reads:
  - כל member פעיל: isActiveIn(resource.data.boatId)
writes:
  - יצירה ישירה: כל member פעיל (status = 'open' בלבד)
  - עדכון status: אסור ישירות — Cloud Functions בלבד
  - שדות נעולים ב-client create: assignedToUserId, resolvedAt, closedAt
```

---

## 12. maintenance_updates

```
reads:
  - כל member פעיל בסירה
writes:
  - אסור ישירות מה-client
```

---

## 13. maintenance_attachments

```
reads:
  - כל member פעיל בסירה
writes:
  - כל member פעיל יכול להוסיף (לאחר העלאה ל-Storage)
  - מחיקה: maintenanceManager / admin
```

---

## 14. announcements

```
reads:
  - כל member פעיל בסירה
writes:
  - admin בלבד, ישירות מה-client מותר
```

---

## 15. checklists

```
reads:
  - כל member פעיל
writes:
  - maintenanceManager / admin
```

---

## 16. checklist_runs

```
reads:
  - כל member פעיל
writes:
  - כל member פעיל יכול ליצור run חדש
  - עדכון/מחיקה: author או admin
```

---

## 17. contacts

```
reads:
  - כל member פעיל
writes:
  - maintenanceManager / admin
```

---

## 18. feedback_reports

```
reads:
  - partner: רק הדיווחים שלו (userId == request.auth.uid)
  - admin: כל הדיווחים בסירה
writes:
  - יצירה: כל member פעיל
  - עדכון status: admin בלבד
```

---

## 19. feedback_attachments

```
reads:
  - כל member פעיל בסירה
writes:
  - יצירה: כל member פעיל
```

---

## 20. audit_logs

```
reads:
  - admin בלבד
writes:
  - אסור לחלוטין ישירות מה-client
  - נכתב אך ורק על ידי Cloud Functions דרך admin SDK
```

---

## 21. system_settings

```
reads:
  - admin בלבד
writes:
  - admin בלבד
```

---

## 22. backups

```
reads:
  - admin בלבד
writes:
  - אסור ישירות מה-client
```

---

# Firebase Storage Rules Strategy

## Paths

| Path | Read | Write | Max Size |
|------|------|-------|----------|
| `boats/{boatId}/maintenance/{ticketId}/{file}` | member פעיל | member פעיל | 10MB |
| `boats/{boatId}/feedback/{reportId}/{file}` | author / admin | author בלבד | 10MB |
| `boats/{boatId}/backups/{file}` | admin בלבד | Cloud Functions (admin SDK) | ללא הגבלה |

## Validation

- גודל מקסימלי: 10MB לקובץ (למעט backups)
- סוגי קבצים מותרים: `image/*`, `application/pdf`, `video/*`

---

# Rules Architecture

## firestore.rules — Template Structure

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ===== Helper Functions =====
    function isAuthenticated() { ... }
    function getMembership(boatId) { ... }
    function isMemberOf(boatId) { ... }
    function isActiveIn(boatId) { ... }
    function getRoleIn(boatId) { ... }
    function hasRoleIn(boatId, role) { ... }
    function hasAnyRoleIn(boatId, roles) { ... }
    function isAdminOf(boatId) { ... }

    // ===== Collections =====
    match /users/{userId} { ... }
    match /boats/{boatId} { ... }
    match /boat_members/{memberId} { ... }
    match /partners/{partnerId} { ... }
    match /invitations/{invitationId} { ... }
    match /bookings/{bookingId} { ... }
    match /credit_transactions/{txId} { ... }
    match /charges/{chargeId} { ... }
    match /partner_invoices/{invoiceId} { ... }
    match /payments/{paymentId} { ... }
    match /maintenance_tickets/{ticketId} { ... }
    match /maintenance_updates/{updateId} { ... }
    match /maintenance_attachments/{attachId} { ... }
    match /announcements/{announcementId} { ... }
    match /checklists/{checklistId} { ... }
    match /checklist_runs/{runId} { ... }
    match /contacts/{contactId} { ... }
    match /feedback_reports/{reportId} { ... }
    match /feedback_attachments/{attachId} { ... }
    match /audit_logs/{logId} { ... }
    match /system_settings/{settingId} { ... }
    match /backups/{backupId} { ... }
  }
}
```

---

# Risk Levels per Collection

| Collection | Risk Level | Primary Concern |
|------------|------------|-----------------|
| `audit_logs` | 🔴 Critical | No client writes ever |
| `credit_transactions` | 🔴 Critical | No client writes ever |
| `partner_invoices` | 🔴 Critical | No client writes ever |
| `payments` | 🔴 Critical | No client writes ever |
| `bookings` | 🔴 Critical | No client writes ever |
| `boat_members` | 🔴 Critical | No client writes ever |
| `invitations` | 🔴 Critical | No client writes ever |
| `partners` (credits/status) | 🔴 Critical | Field-level protection |
| `backups` | 🔴 Critical | Admin read; no client write |
| `system_settings` | 🟠 High | Admin only |
| `charges` | 🟠 High | Treasurer/admin via CF |
| `boats` | 🟠 High | Admin edit |
| `maintenance_tickets` | 🟡 Medium | Open create; restricted update |
| `announcements` | 🟡 Medium | Admin write |
| `checklists` | 🟡 Medium | maintenanceManager write |
| `contacts` | 🟡 Medium | maintenanceManager write |
| `feedback_reports` | 🟢 Low | Any member creates |
| `checklist_runs` | 🟢 Low | Any member creates |

---

# Key Principles Summary

1. **Default deny** — כל מה שלא מוגדר מפורשות — חסום.
2. **Memberships via Custom Claims** — map של `{ boatId: { role, status } }`.
3. **boatId isolation** — כל read ו-write מוגן לפי `boatId` מה-claims.
4. **No client writes to critical collections** — bookings, credits, invoices, payments, audit, boat_members, invitations.
5. **Cloud Functions use Admin SDK** — עוקפות rules; הן אחראיות לוולידציה עסקית.
6. **Field-level locks** — credits, financialStatus, role לא ניתנים לשינוי ישיר מה-client.
7. **Read scoping by ownership** — partner רואה רק נתונים שלו בסירה שלו.
8. **Cross-boat isolation** — user אינו יכול לקרוא נתונים של סירה שאינו חבר בה.
