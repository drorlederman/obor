# Business Rules

מסמך זה מגדיר את חוקי המערכת העסקיים של OBOR.

חוקים אלו מהווים את הבסיס ללוגיקה העסקית שתיאכף ב-Cloud Functions וב-backend.

---

# General Principles

- כל המשתמשים מזוהים באמצעות Firebase Authentication
- מקור האמת לתפקיד הוא `boat_members.role` — per-boat, לא גלובלי
- `partners` משמשים לחישובי מטבעות ופיננסים בלבד
- פעולות קריטיות חייבות להתבצע דרך Cloud Functions
- אין להסתמך על ה-client בלבד לצורך ולידציה עסקית
- כל פעולה עסקית מוגדרת תמיד ביחס ל-`boatId` פעיל

---

# Boat Creation Rules

### 1. כל user מחובר יכול ליצור סירה

אין הגבלת מספר סירות למשתמש.

### 2. יוצר הסירה הופך לאדמין

בעת יצירת סירה חדשה:
- נוצר מסמך `boats`
- נוצר מסמך `boat_members` עם `role = 'admin'` ו-`status = 'active'`
- נוצר מסמך `partners` עבור יוצר הסירה
- נוצרים `system_settings` בברירות מחדל
- נכתב `audit_logs` מסוג `boat_created`

### 3. שדות חובה ביצירה

- `name` — שם הסירה
- `code` — קוד ייחודי לסירה (ייחודי בתוך הסירה, לא גלובלי)

---

# Invitation Rules

### 1. מי יכול להזמין

רק `admin` של הסירה יכול לשלוח הזמנות.

### 2. הזמנה נשלחת לפי email

- נוצר מסמך `invitations` עם `token` ייחודי
- נשלח email עם קישור `https://app.obor.dev/join/{token}`
- ה-token תקף ל-7 ימים (ברירת מחדל; ניתן לשינוי ב-settings)

### 3. הגבלות הזמנה

- אין להזמין email שכבר חבר פעיל בסירה
- ניתן לשלוח הזמנה חדשה אם ההזמנה הקודמת פגה או בוטלה
- אין הגבלת מספר הזמנות ממתינות בו-זמנית

### 4. קבלת הזמנה

כאשר משתמש לוחץ על קישור ההזמנה:

1. בדיקת תוקף ה-token: `status = 'pending'` ו-`expiresAt > now`
2. אם המשתמש לא מחובר → מסך login/register
3. אחרי אימות:
   - נוצר מסמך `boat_members` עם ה-role שהוגדר בהזמנה
   - נוצר מסמך `partners`
   - ה-invitation מסומנת `accepted`
   - מתעדכנים Custom Claims
   - נכתב `audit_logs` מסוג `member_joined`

### 5. הזמנה שפגה

- `status = 'expired'` (מוגדר על ידי scheduled function)
- אין להשתמש ב-token שפג
- יוצג מסך שגיאה עם אפשרות לבקש הזמנה חדשה

---

# Multi-Boat Rules

### 1. משתמש יכול להיות חבר במספר סירות

- תפקיד שונה לכל סירה
- context סירה פעיל נבחר ב-app state

### 2. החלפת סירה

- המשתמש יכול להחליף את הסירה הפעילה בכל עת
- כל ה-queries מתאפסים ל-`boatId` החדש

### 3. הסרת חבר

- רק `admin` יכול להסיר חבר
- `boat_members.status` עובר ל-`removed`
- `partners.status` עובר ל-`removed`
- Custom Claims מתעדכנים
- נכתב `audit_logs` מסוג `member_removed`
- לא למחוק — לשמור לhistory

---

# Booking Rules

## Booking Types

| type | description |
|-----|-------------|
| private_sail | הפלגה פרטית של שותף |
| partner_sail | הפלגה משותפת שניתן להצטרף אליה |
| marina_use | שימוש בסירה בתוך המרינה |
| maintenance_block | חסימת תחזוקה |

---

# Booking Creation Rules

### 1. אין חפיפה בין הזמנות פעילות

נבדק לפי `boatId` + `status = 'active'` + חפיפת טווח זמן.

### 2. אין הזמנה בזמן חסימת תחזוקה

אסור ליצור הזמנה רגילה כאשר קיים `maintenance_block` פעיל החופף.

### 3. endTime > startTime

חובה בכל סוגי ההזמנות.

### 4. בעלות על הזמנה

- partner יכול ליצור הזמנה רק אם `ownerPartnerId == currentUser.partnerId` באותה סירה
- scheduler ו-admin יכולים ליצור הזמנה עבור כל partner בסירה

### 5. maintenance_block מוגבל

רק `scheduler` ו-`admin` יכולים ליצור `maintenance_block`.

### 6. בדיקת יתרת מטבעות

- אם הסוג אינו `maintenance_block`, נדרשת יתרה מספיקה
- `creditType` נקבע לפי יום: `weekday` / `weekend` לפי `system_settings/credits`
- `creditsUsed = durationHours` (1:1)

### 7. הקפאה פיננסית חוסמת יצירת הזמנה

`partners.financialStatus = 'frozen'` → לא ניתן ליצור הזמנה.

### 8. אחרי יצירה

- מנוכים מטבעות מ-`partners`
- נוצר `credit_transactions` מסוג `debit`
- נוצר `audit_logs` מסוג `booking_created`

---

# Booking Cancellation Rules

### 1. רק הזמנות פעילות ניתנות לביטול

`status = 'active'` בלבד.

### 2. הרשאת ביטול

- partner: רק אם הוא `ownerPartnerId`
- scheduler / admin: כל הזמנה בסירה

### 3. החזר מטבעות

- אם `creditsUsed > 0` → מוחזרים מטבעות + `credit_transactions` מסוג `refund`
- `maintenance_block` — אין החזר

---

# Partner Sail Join Rules

### 1. רק `partner_sail`
### 2. ההזמנה פעילה ועתידית (`startTime > now`)
### 3. אי-כפילות ב-`participants`
### 4. לא מוקפא פיננסית
### 5. יתרת מטבעות מספיקה

---

# Credits Rules

### 1. מקור האמת

`partners.weekdayCreditsBalance` ו-`partners.weekendCreditsBalance`.
כל שינוי → `credit_transactions`.

### 2. ערכים תמיד חיוביים

`amount` חיובי תמיד; המשמעות לפי `type` (`debit` / `credit` / `refund` / `adjustment`).

### 3. קביעת סוג מטבע

לפי יום ההפלגה ו-`system_settings/credits.weekendDays`.

### 4. התאמה ידנית

רק `admin`, חובה לספק `description`. נכתב `audit_logs` מסוג `credits_adjusted`.

### 5. אין ניכוי מתחת לאפס

בדיקה בשרת לפני ביצוע הפעולה.

---

# Finance Rules

## Charges

מחזור חיים: `draft → published → closed`

- רק `treasurer` / `admin` יכולים לפרסם
- בפרסום: נוצרות `partner_invoices` לכל שותף עם `status = 'active'`
- פיצול שווה: `amount = totalAmount / activePartnerCount`

## Partner Invoices

מחזור חיים: `open → partial → paid / overdue`

- `overdue`: scheduled function יומית (`dueDate < now` + `amountRemaining > 0`)
- אחרי כל תשלום: `amountPaid`, `amountRemaining`, `status`, `lastPaymentAt` מתעדכנים

## Payments

- רק `treasurer` / `admin` רושמים תשלום
- `amount > 0`
- חשבונית אינה `paid`

---

# Partner Status Rules

| status | description |
|--------|-------------|
| active | גישה מלאה |
| frozen (financial) | גישה מוגבלת |
| removed | חסום לחלוטין |

### Freeze Rules

`financialStatus = 'frozen'`:
- ❌ יצירת הזמנה
- ❌ הצטרפות ל-partner sail
- ✅ צפייה בנתונים
- ✅ שליחת feedback

---

# Maintenance Rules

### 1. פתיחת קריאה

כל member פעיל יכול לפתוח קריאה.

### 2. עדכון סטטוס

רק `maintenanceManager` ו-`admin`.

### 3. מחזור חיים

`open → in_progress → waiting_parts → resolved → closed`

### 4. תיעוד שינויי סטטוס

כל שינוי → `maintenance_updates` עם `statusBefore`, `statusAfter`.

---

# Checklist Rules

- תבניות מנוהלות על ידי `maintenanceManager` / `admin`
- ביצוע checklist run — כל member פעיל
- item עם `required = true` חייב להיות מסומן

---

# Announcement Rules

- רק `admin` יוצר ועורך
- `isActive = true` + `expiresAt > now` → מוצג ב-dashboard

---

# Audit Log Rules

- נכתב אך ורק על ידי Cloud Functions
- אינו ניתן לקריאה על ידי partners רגילים
- כל audit_log כולל `boatId`

### פעולות שחייבות תיעוד

- `boat_created`
- `invitation_sent`
- `member_joined`
- `member_removed`
- `member_role_changed`
- `booking_created`
- `booking_cancelled`
- `partner_sail_joined`
- `credits_adjusted`
- `charge_created`
- `charge_published`
- `invoices_created`
- `payment_registered`
- `partner_frozen`
- `partner_unfrozen`
- `maintenance_status_changed`
- `backup_created`
- `restore_performed`

---

# System Settings Rules

- רק `admin` קורא ומשנה
- הגדרות חלות על הסירה הפעילה בלבד
- שינויים אינם משפיעים רטרואקטיבית

---

# Backup & Restore Rules

- רק `admin` יוצר ומשחזר
- שחזור מצריך `confirm = true` מפורש
- גיבוי כולל את כל ה-collections עם `boatId` הרלוונטי בלבד
- נכתב `audit_logs` על כל גיבוי ושחזור
