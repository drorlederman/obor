# Routes

מסמך זה מגדיר את מפת הניווט של האפליקציה OBOR.

המסמך כולל:
- מסלולי ניווט
- רמות גישה
- כללי guards
- מבנה ניווט למובייל ולדסקטופ
- כוונת שימוש לכל מסך

כל הטקסטים למשתמש יוצגו בעברית, בעוד שכתובות ה-URL יישארו באנגלית.

---

# Core Principles

- כל המסכים בממשק יוצגו בעברית
- כל כתובות ה-URL יהיו באנגלית
- כל route מוגן לפי authentication, boat membership וסטטוס
- משתמש שאינו authenticated יופנה ל-`/login`
- משתמש authenticated ללא סירה פעילה יופנה ל-`/welcome`
- משתמש עם `boat_members.status = 'removed'` בסירה הנוכחית — יוצג מסך חסום
- משתמש עם `financialStatus = 'frozen'` יכול לצפות במידע, אך מוגבל בפעולות עסקיות
- route guards מגינות על מסכים; button-level guards מגינות על פעולות

---

# Route Groups

האפליקציה מחולקת לארבע קבוצות:

1. Public routes
2. Onboarding routes (authenticated, no boat yet)
3. Authenticated boat routes
4. Admin / privileged routes

---

# Public Routes

## `/login`

### Screen
התחברות

### Access
ציבורי

### Purpose
- התחברות / הרשמה חדשה באמצעות Firebase Authentication
- טעינת session
- ניתוב משתמש מאומת

### Notes
- משתמש מחובר עם סירה פעילה → `/dashboard`
- משתמש מחובר ללא סירה → `/welcome`
- הרשמה חדשה: email + password, ללא כניסה על ידי admin

---

# Onboarding Routes

מסכים למשתמש שהתחבר אך טרם שויך לסירה, או מצטרף לסירה חדשה.

## `/welcome`

### Screen
ברוך הבא

### Access
משתמש מחובר ללא boat membership פעיל

### Purpose
- הצגת אפשרויות:
  - יצירת סירה חדשה
  - הצטרפות לסירה קיימת דרך קישור

---

## `/create-boat`

### Screen
יצירת סירה חדשה

### Access
משתמש מחובר

### Purpose
- אשף יצירת workspace חדש לסירה
- המשתמש מקבל אוטומטית תפקיד `admin`

### Main Content
- שם הסירה
- קוד / nickname
- מרינה ביתית

---

## `/join/:token`

### Screen
הצטרפות לסירה (קישור הזמנה)

### Access
ציבורי (deep link)

### Purpose
- קבלת הזמנה דרך קישור ייחודי
- אם לא מחובר → login/register → קבלת ההזמנה
- אם מחובר → קבלת ההזמנה ישירות

### Notes
- `token` נבדק מול `invitations` collection
- הזמנה שפגה / בוטלה / התקבלה — מסך שגיאה מתאים
- הפניה לאחר קבלה: `/dashboard`

---

## `/switch-boat`

### Screen
בחירת סירה

### Access
משתמש מחובר החבר ביותר מסירה אחת

### Purpose
- הצגת רשימת הסירות שהמשתמש חבר בהן
- בחירת context פעיל

---

# Authenticated Boat Routes

כל route מוגן: דורש authentication + boat membership פעיל.

## `/`

### Screen
Redirect

### Access
כל member מחובר

### Purpose
הפניה אוטומטית ל-`/dashboard`

---

## `/dashboard`

### Screen
לוח בקרה

### Access
כל member מחובר

### Purpose
תצוגת מצב מהירה של הסירה הפעילה.

### Main Content
- מזג אוויר
- ההזמנות של היום
- סיכום מטבעות
- קריאות תחזוקה קריטיות
- הודעות פעילות

---

## `/bookings`

### Screen
יומן הזמנות

### Access
כל member מחובר

### Main Content
- תצוגת חודש / שבוע / יום
- רשימת הזמנות
- גישה לפרטי הזמנה
- פעולות מותרות לפי role

---

## `/bookings/new`

### Screen
יצירת הזמנה

### Access
`partner`, `scheduler`, `admin`

### Notes
- partner יוצר הזמנה רק עבור עצמו
- `maintenance_block` — רק `scheduler` ו-`admin`
- יצירה דרך Cloud Function

---

## `/bookings/:bookingId`

### Screen
פרטי הזמנה

### Access
כל member מחובר

### Main Content
- סוג הזמנה, בעל, זמנים, משתתפים, סטטוס
- ביטול / הצטרפות / צפייה לפי role

---

## `/credits`

### Screen
מטבעות

### Access
כל member מחובר

### Main Content
- מטבעות לימי חול / סוף שבוע
- ledger history
- התאמה ידנית לadmin בלבד

---

## `/finance`

### Screen
פיננסים

### Access
כל member מחובר

### Behavior by Role
- partner: מידע פיננסי של עצמו בלבד
- treasurer/admin: overview רחב

---

## `/finance/charges`

### Screen
חיובים

### Access
`treasurer`, `admin`

---

## `/finance/invoices`

### Screen
חשבוניות

### Access
כל member מחובר

### Behavior by Role
- partner: חשבוניות שלו בלבד
- treasurer/admin: כל החשבוניות

---

## `/finance/payments`

### Screen
תשלומים

### Access
`treasurer`, `admin`

---

## `/maintenance`

### Screen
תחזוקה

### Access
כל member מחובר

---

## `/maintenance/new`

### Screen
קריאת תחזוקה חדשה

### Access
כל member מחובר

---

## `/maintenance/:ticketId`

### Screen
פרטי קריאת תחזוקה

### Access
כל member מחובר

---

## `/announcements`

### Screen
הודעות

### Access
כל member מחובר

### Notes
- יצירה ועריכה ל-admin בלבד

---

## `/checklists`

### Screen
צ'קליסטים

### Access
כל member מחובר

---

## `/checklists/:checklistId`

### Screen
פרטי צ'קליסט

### Access
כל member מחובר

---

## `/contacts`

### Screen
אנשי קשר חשובים

### Access
כל member מחובר

### Notes
- ניהול ל-`maintenanceManager` ו-`admin`

---

## `/feedback`

### Screen
פידבק ודיווח תקלות

### Access
כל member מחובר

### Behavior by Role
- partner: דיווחים של עצמו
- admin: כל הדיווחים

---

## `/feedback/new`

### Screen
דיווח חדש

### Access
כל member מחובר

---

## `/profile`

### Screen
פרופיל אישי

### Access
כל member מחובר

### Notes
- role אינו ניתן לעריכה עצמית
- מציג גם את רשימת הסירות שהמשתמש חבר בהן

---

# Admin / Privileged Routes

## `/partners`

### Screen
ניהול שותפים

### Access
`admin`

### Main Content
- רשימת שותפים בסירה הפעילה
- הזמנת שותף חדש
- ניהול role, הקפאה, הסרה

---

## `/partners/:partnerId`

### Screen
פרטי שותף

### Access
`admin`

---

## `/settings`

### Screen
הגדרות מערכת

### Access
`admin`

### Notes
- הגדרות חלות על הסירה הפעילה בלבד

---

## `/settings/credits`

### Screen
הגדרות מטבעות

### Access
`admin`

---

## `/settings/notifications`

### Screen
הגדרות התראות

### Access
`admin`

---

## `/settings/weather`

### Screen
הגדרות מזג אוויר

### Access
`admin`

---

## `/audit`

### Screen
לוג ביקורת

### Access
`admin`

---

## `/backups`

### Screen
גיבוי ושחזור

### Access
`admin`

---

# Route Guards

## Unauthenticated User
כל route פרטי → `/login`

## Authenticated without Boat
כל boat route → `/welcome`

## Removed Member
`boat_members.status = 'removed'` בסירה הפעילה → מסך חסום

## Financially Frozen
`partners.financialStatus = 'frozen'` → כניסה מותרת, פעולות עסקיות מסוימות חסומות

---

# Mobile Navigation Structure

## Bottom Tab Navigation

5 טאבים:
1. לוח בקרה
2. יומן
3. מטבעות
4. תחזוקה
5. עוד

## Mobile "More" Screen

- פיננסים
- הודעות
- צ'קליסטים
- אנשי קשר
- פידבק
- פרופיל
- החלפת סירה (אם חבר ביותר מאחת)

Admin בלבד:
- ניהול שותפים
- הגדרות מערכת
- לוג ביקורת
- גיבוי ושחזור

---

# Desktop Navigation Structure

## Sidebar Navigation

- לוח בקרה
- יומן הזמנות
- מטבעות
- פיננסים
- תחזוקה
- הודעות
- צ'קליסטים
- אנשי קשר
- פידבק
- פרופיל
- (boat switcher בראש הsidebar)

Admin בלבד:
- ניהול שותפים
- הגדרות מערכת
- לוג ביקורת
- גיבוי ושחזור

---

# Route Metadata Recommendation

```ts
{
  path: "/bookings",
  title: "יומן הזמנות",
  requiresAuth: true,
  requiresBoat: true,
  allowedRoles: ["partner", "scheduler", "treasurer", "maintenanceManager", "admin"],
  showInNav: true,
  navGroup: "main",
  mobileTabEligible: true
}
```
