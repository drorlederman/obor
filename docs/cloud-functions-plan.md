# Cloud Functions Plan

מסמך זה מגדיר את תכנון פונקציות השרת עבור OBOR.

המטרה היא לרכז ב-Cloud Functions את כל הפעולות העסקיות הקריטיות, כך שה-client לא יבצע לוגיקה רגישה ישירות מול Firestore.

---

# Core Principles

- פעולות עסקיות קריטיות מתבצעות רק דרך Cloud Functions
- ה-client אינו מעדכן ישירות credits, invoices, payments, boat_members, invitations או audit logs
- כל פעולה רגישה חייבת לכלול:
  - אימות משתמש
  - בדיקת role ב-boat_members לפי boatId הרלוונטי
  - בדיקת ownership לפי הצורך
  - ולידציה עסקית
  - כתיבה אטומית ל-Firestore
  - עדכון Custom Claims אם נדרש
  - יצירת audit log
- פונקציות חייבות להחזיר שגיאות מובנות וברורות
- אין לחשוף stack traces או מידע פנימי למשתמש

---

# Function Categories

- boats (onboarding, membership)
- bookings
- credits
- finance
- maintenance
- backup
- notifications
- weather
- audit
- shared utilities

---

# Boat & Membership Functions

## createBoat

מטרה: יצירת workspace חדש לסירה + שיוך המשתמש כ-admin.

### Input
- `name: string`
- `code: string`
- `homeMarina: string | null`

### Responsibilities
- לוודא שהמשתמש authenticated
- ליצור מסמך `boats`
- ליצור מסמך `boat_members` עם `role = 'admin'`, `status = 'active'`
- ליצור מסמך `partners` עבור יוצר הסירה
- ליצור `system_settings` בברירות מחדל (`credits`, `notifications`, `weather`)
- לעדכן Custom Claims: להוסיף `boatId: { role: 'admin', status: 'active' }` ל-memberships
- ליצור `audit_logs` מסוג `boat_created`

### Writes
- `boats`
- `boat_members`
- `partners`
- `system_settings` (3 מסמכים)
- `audit_logs`
- Custom Claims

---

## invitePartner

מטרה: שליחת הזמנה לשותף חדש.

### Input
- `boatId: string`
- `email: string`
- `role: MemberRole`

### Responsibilities
- לוודא שהמשתמש authenticated
- לוודא שה-role בסירה הוא `admin`
- לוודא שה-email אינו כבר member פעיל בסירה
- לוודא שאין הזמנה `pending` קיימת לאותו email באותה סירה
- ליצור מסמך `invitations` עם token ייחודי ו-`expiresAt = now + 7 days`
- לשלוח email עם קישור הזמנה (דרך Firebase Extension או SendGrid)
- ליצור `audit_logs` מסוג `invitation_sent`

### Writes
- `invitations`
- `audit_logs`

---

## acceptInvitation

מטרה: קבלת הזמנה והצטרפות לסירה.

### Input
- `token: string`

### Responsibilities
- לוודא שהמשתמש authenticated
- לאתר `invitations` לפי token
- לוודא ש-`status = 'pending'`
- לוודא ש-`expiresAt > now`
- לוודא שהמשתמש אינו כבר member בסירה זו
- ליצור מסמך `boat_members` עם ה-role מההזמנה
- ליצור מסמך `partners`
- לעדכן את ה-invitation ל-`accepted`
- לעדכן `boats.memberCount`
- לעדכן Custom Claims: להוסיף את הסירה החדשה ל-memberships
- ליצור `audit_logs` מסוג `member_joined`

### Writes
- `boat_members`
- `partners`
- `invitations`
- `boats`
- `audit_logs`
- Custom Claims

---

## revokeInvitation

מטרה: ביטול הזמנה ממתינה.

### Input
- `invitationId: string`

### Responsibilities
- לוודא שהמשתמש authenticated
- לוודא שה-role בסירה הוא `admin`
- לוודא שההזמנה במצב `pending`
- לעדכן ל-`status = 'cancelled'`
- ליצור `audit_logs` מסוג `invitation_cancelled`

### Writes
- `invitations`
- `audit_logs`

---

## removeMember

מטרה: הסרת שותף מסירה.

### Input
- `boatId: string`
- `userId: string`

### Responsibilities
- לוודא שהמשתמש authenticated
- לוודא שה-role בסירה הוא `admin`
- לוודא שלא מסירים את עצמו (admin לא יכול להסיר את עצמו אם הוא היחיד)
- לעדכן `boat_members.status = 'removed'`
- לעדכן `partners.status = 'removed'`
- לעדכן `boats.memberCount`
- לעדכן Custom Claims: להסיר את ה-boatId מ-memberships
- ליצור `audit_logs` מסוג `member_removed`

### Writes
- `boat_members`
- `partners`
- `boats`
- `audit_logs`
- Custom Claims

---

## changeMemberRole

מטרה: שינוי תפקיד שותף בסירה.

### Input
- `boatId: string`
- `userId: string`
- `newRole: MemberRole`

### Responsibilities
- לוודא שהמשתמש authenticated ו-`admin` בסירה
- לוודא שלא מורידים את עצמם מ-`admin` אם הם היחיד
- לעדכן `boat_members.role`
- לעדכן Custom Claims
- ליצור `audit_logs` מסוג `member_role_changed`

### Writes
- `boat_members`
- `audit_logs`
- Custom Claims

---

# Booking Functions

## createBooking

### Input
- `boatId: string`
- `ownerPartnerId: string`
- `type: BookingType`
- `title: string`
- `notes: string | null`
- `startTime: ISO string`
- `endTime: ISO string`

### Responsibilities
- לוודא authentication + membership פעיל בסירה
- לוודא ownership (`ownerPartnerId == currentUser.partnerId` לpartner)
- לוודא הרשאת maintenance_block רק לscheduler/admin
- לוודא `endTime > startTime`
- לבדוק חפיפות (bookings פעילות + maintenance blocks) בתוך הסירה
- לקבוע `creditType` לפי `system_settings/credits`
- לבדוק יתרת מטבעות (אם לא maintenance_block)
- ליצור booking
- לנכות credits + `credit_transactions` מסוג `debit`
- ליצור `audit_logs` מסוג `booking_created`

### Writes
- `bookings`
- `partners`
- `credit_transactions`
- `audit_logs`

---

## cancelBooking

### Input
- `bookingId: string`

### Responsibilities
- לוודא authentication + membership פעיל בסירה
- לוודא שהמשתמש הוא owner או scheduler/admin
- לוודא `status = 'active'`
- לעדכן booking ל-`cancelled`
- להחזיר credits (אם creditsUsed > 0) + `credit_transactions` מסוג `refund`
- ליצור `audit_logs` מסוג `booking_cancelled`

### Writes
- `bookings`
- `partners`
- `credit_transactions`
- `audit_logs`

---

## joinPartnerSail

### Input
- `bookingId: string`

### Responsibilities
- לוודא authentication + membership פעיל בסירה
- לוודא `type = 'partner_sail'`, `status = 'active'`, `startTime > now`
- לוודא שהמשתמש לא ב-`participants`
- לוודא שאינו מוקפא פיננסית
- לבדוק יתרת credits
- לעדכן `participants`
- לנכות credits + `credit_transactions` מסוג `debit`
- ליצור `audit_logs` מסוג `partner_sail_joined`

### Writes
- `bookings`
- `partners`
- `credit_transactions`
- `audit_logs`

---

# Credits Functions

## adjustCredits

### Input
- `boatId: string`
- `partnerId: string`
- `creditType: 'weekday' | 'weekend'`
- `operation: 'add' | 'subtract'`
- `amount: number`
- `description: string`

### Responsibilities
- לוודא authentication + `admin` בסירה
- לוודא `amount > 0`
- לעדכן יתרת credits ב-`partners`
- ליצור `credit_transactions` מסוג `adjustment`
- ליצור `audit_logs` מסוג `credits_adjusted`

### Writes
- `partners`
- `credit_transactions`
- `audit_logs`

---

# Finance Functions

## createCharge

### Input
- `boatId: string`
- `title: string`
- `description: string | null`
- `category: ChargeCategory`
- `totalAmount: number`
- `dueDate: ISO string`

### Responsibilities
- לוודא authentication + `treasurer` / `admin` בסירה
- לוודא `totalAmount > 0`
- ליצור `charges` במצב `draft`
- ליצור `audit_logs` מסוג `charge_created`

### Writes
- `charges`
- `audit_logs`

---

## publishCharge

### Input
- `chargeId: string`

### Responsibilities
- לוודא authentication + `treasurer` / `admin`
- לטעון את ה-charge ולוודא `status = 'draft'`
- לטעון כל `partners` עם `status = 'active'` בסירה
- לחשב פיצול שווה
- ליצור `partner_invoices` לכל שותף
- לעדכן charge ל-`published`
- ליצור `audit_logs` מסוג `charge_published` + `invoices_created`

### Writes
- `charges`
- `partner_invoices`
- `audit_logs`

---

## registerPayment

### Input
- `invoiceId: string`
- `amount: number`
- `method: PaymentMethod`
- `reference: string | null`
- `notes: string | null`
- `paidAt: ISO string`

### Responsibilities
- לוודא authentication + `treasurer` / `admin`
- לוודא `amount > 0`
- לוודא שהחשבונית אינה `paid`
- ליצור `payments`
- לעדכן `amountPaid`, `amountRemaining`, `status`, `lastPaymentAt`
- ליצור `audit_logs` מסוג `payment_registered`

### Writes
- `payments`
- `partner_invoices`
- `audit_logs`

---

## freezePartner / unfreezePartner

### Input
- `boatId: string`
- `partnerId: string`

### Responsibilities
- לוודא authentication + `treasurer` / `admin`
- לעדכן `partners.financialStatus`
- ליצור `audit_logs` מסוג `partner_frozen` / `partner_unfrozen`

### Writes
- `partners`
- `audit_logs`

---

# Maintenance Functions

## updateMaintenanceStatus

### Input
- `ticketId: string`
- `status: TicketStatus`
- `comment: string | null`

### Responsibilities
- לוודא authentication + `maintenanceManager` / `admin`
- לשמור `statusBefore`
- לעדכן `statusAfter`, `resolvedAt`, `closedAt` לפי הצורך
- ליצור `maintenance_updates`
- ליצור `audit_logs` מסוג `maintenance_status_changed`

### Writes
- `maintenance_tickets`
- `maintenance_updates`
- `audit_logs`

---

## addMaintenanceUpdate

### Input
- `ticketId: string`
- `comment: string`

### Responsibilities
- לוודא authentication + `maintenanceManager` / `admin`
- ליצור `maintenance_updates`
- לעדכן `updatedAt` ב-`maintenance_tickets`
- ליצור `audit_logs` מסוג `maintenance_update_added`

### Writes
- `maintenance_updates`
- `maintenance_tickets`
- `audit_logs`

---

# Backup Functions

## createSystemBackup

### Input
- `boatId: string`
- `notes: string | null`

### Responsibilities
- לוודא authentication + `admin` בסירה
- לייצא collections עם `boatId` המתאים ל-JSON
- לשמור ב-Firebase Storage תחת `boats/{boatId}/backups/`
- ליצור metadata ב-`backups`
- ליצור `audit_logs` מסוג `backup_created`

### Writes
- `backups`
- `audit_logs`
- Firebase Storage

---

## restoreBackup

### Input
- `backupId: string`
- `confirm: true`

### Responsibilities
- לוודא authentication + `admin` בסירה
- לוודא `confirm == true`
- לטעון backup metadata
- לטעון JSON מ-Storage
- לבצע restore לacollections בתוך ה-boatId
- ליצור `audit_logs` מסוג `restore_performed`

---

# Scheduled Functions

## markOverdueInvoices
תדירות: פעם ביום
מטרה: `partner_invoices` שעבר dueDate → `status = 'overdue'`

## expireInvitations
תדירות: פעם ביום
מטרה: `invitations` שעבר `expiresAt` + `status = 'pending'` → `status = 'expired'`

## paymentReminders
תדירות: פעם בשבוע
מטרה: תזכורות לשותפים עם חובות פתוחים

## maintenanceAlerts
תדירות: פעם ביום
מטרה: הבלטת tickets קריטיים פתוחים

## weatherSync
תדירות: כל כמה שעות
מטרה: סנכרון נתוני מזג אוויר

---

# Shared Utilities

## auth helpers
- ensureAuthenticated
- ensureActiveMemberOf(boatId)
- ensureRoleIn(boatId, roles)
- updateCustomClaims(uid, boatId, role, status)
- removeFromCustomClaims(uid, boatId)

## firestore helpers
- transaction wrapper
- timestamp normalization
- safe document loading

## booking helpers
- overlap detection (scoped to boatId)
- maintenance block detection
- duration calculation
- creditType calculation

## finance helpers
- invoice status calculation
- equal split calculation

## audit helpers
- writeAuditLog(boatId, action, entity, details)

---

# Recommended Folder Structure

```text
functions/
  src/
    boats/
      createBoat.ts
      invitePartner.ts
      acceptInvitation.ts
      revokeInvitation.ts
      removeMember.ts
      changeMemberRole.ts
    bookings/
      createBooking.ts
      cancelBooking.ts
      joinPartnerSail.ts
    credits/
      adjustCredits.ts
    finance/
      createCharge.ts
      publishCharge.ts
      registerPayment.ts
      freezePartner.ts
      unfreezePartner.ts
    maintenance/
      updateMaintenanceStatus.ts
      addMaintenanceUpdate.ts
    backup/
      createSystemBackup.ts
      restoreBackup.ts
    scheduled/
      markOverdueInvoices.ts
      expireInvitations.ts
      paymentReminders.ts
      maintenanceAlerts.ts
      weatherSync.ts
    audit/
      writeAuditLog.ts
    shared/
      auth.ts
      claims.ts
      firestore.ts
      errors.ts
      dates.ts
      booking-utils.ts
      finance-utils.ts
    index.ts
```
