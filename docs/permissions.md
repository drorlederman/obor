# Permissions Matrix

מסמך זה מגדיר את מודל ההרשאות של OBOR.

## Roles

המערכת כוללת את התפקידים הבאים:

- `partner`
- `scheduler`
- `treasurer`
- `maintenanceManager`
- `admin`

### Role Source of Truth

**`boat_members.role`** הוא מקור האמת היחיד לתפקיד המשתמש — **per-boat**.

- אין role גלובלי; כל תפקיד מוגדר לסירה ספציפית
- משתמש יכול להיות `admin` בסירה A ו-`partner` בסירה B
- `users` collection אינו מכיל `role` כלל
- Custom Claims של Firebase Auth מסונכרנים עם `boat_members.role` ו-`boat_members.status`

---

# Global Principles

- כל משתמש מזוהה באמצעות Firebase Authentication
- רק משתמש עם `boat_members.status = 'active'` בסירה הנוכחית יכול לפעול בה
- הרשאות בדוקות תמיד ביחס ל-`boatId` הפעיל
- `admin` הוא admin של הסירה — לא admin גלובלי של המערכת
- פעולות קריטיות נאכפות גם ב-Firebase Security Rules וגם ב-Cloud Functions
- הקפאה פיננסית אינה חסימת כניסה, אלא חסימת פעולות עסקיות מסוימות

---

# Ownership Rules

## boats

| פעולה | כל member | admin |
|-------|----------|-------|
| create boat | ✅ (כל user) | — |
| view boat details | ✅ | ✅ |
| edit boat details | ❌ | ✅ |
| delete boat | ❌ | ✅ |

---

## boat_members / partners

| פעולה | partner | scheduler | treasurer | maintenanceManager | admin |
|------|--------|-----------|-----------|--------------------|-------|
| view own membership | ✅ | ✅ | ✅ | ✅ | ✅ |
| view all members | ✅ | ✅ | ✅ | ✅ | ✅ |
| invite new member | ❌ | ❌ | ❌ | ❌ | ✅ |
| change member role | ❌ | ❌ | ❌ | ❌ | ✅ |
| remove member | ❌ | ❌ | ❌ | ❌ | ✅ |
| freeze member (financial) | ❌ | ❌ | ✅ | ❌ | ✅ |
| update own contact info | ✅ | ✅ | ✅ | ✅ | ✅ |
| update credits | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## users

| פעולה | עצמי | admin |
|------|------|-------|
| read own profile | ✅ | ✅ |
| update own profile | ✅ | ✅ |
| read others' profiles | ❌ | ✅ |

---

# Bookings

| פעולה | partner | scheduler | admin |
|------|--------|-----------|------|
| view calendar | ✅ | ✅ | ✅ |
| create booking | ✅ | ✅ | ✅ |
| cancel own booking | ✅ | ✅ | ✅ |
| cancel others' booking | ❌ | ✅ | ✅ |
| create maintenance block | ❌ | ✅ | ✅ |

### Booking Ownership Rules

- partner יכול ליצור הזמנה רק אם `ownerPartnerId == currentUser.partnerId` בסירה הנוכחית
- partner יכול לבטל הזמנה רק אם הוא owner
- scheduler/admin יכולים לבטל כל הזמנה בסירה
- `participants` מייצג את כלל השותפים המשתתפים
- הצטרפות ל-`partner_sail` משנה רק את `participants`

---

# Credits

| פעולה | partner | scheduler | treasurer | admin |
|------|--------|-----------|-----------|------|
| view own credits | ✅ | ✅ | ✅ | ✅ |
| view all credits | ❌ | ❌ | ✅ | ✅ |
| manual credit adjustment | ❌ | ❌ | ❌ | ✅ |

---

# Finance

## Charges

| פעולה | partner | treasurer | admin |
|------|--------|-----------|------|
| view | ✅ | ✅ | ✅ |
| create | ❌ | ✅ | ✅ |
| publish | ❌ | ✅ | ✅ |

## Invoices

| פעולה | partner | treasurer | admin |
|------|--------|-----------|------|
| view own | ✅ | ✅ | ✅ |
| view all | ❌ | ✅ | ✅ |

## Payments

| פעולה | partner | treasurer | admin |
|------|--------|-----------|------|
| view own payments | ✅ | ✅ | ✅ |
| register payment | ❌ | ✅ | ✅ |

---

# Maintenance

## Tickets

| פעולה | partner | maintenanceManager | admin |
|------|--------|--------------------|------|
| create ticket | ✅ | ✅ | ✅ |
| view tickets | ✅ | ✅ | ✅ |
| update ticket status | ❌ | ✅ | ✅ |
| close ticket | ❌ | ✅ | ✅ |

## Maintenance Updates

| פעולה | partner | maintenanceManager | admin |
|------|--------|--------------------|------|
| add update | ❌ | ✅ | ✅ |
| view updates | ✅ | ✅ | ✅ |

---

# Announcements

| פעולה | partner | admin |
|------|--------|------|
| view | ✅ | ✅ |
| create | ❌ | ✅ |
| edit | ❌ | ✅ |
| delete | ❌ | ✅ |

---

# Checklists

| פעולה | partner | maintenanceManager | admin |
|------|--------|--------------------|------|
| view | ✅ | ✅ | ✅ |
| execute checklist run | ✅ | ✅ | ✅ |
| create template | ❌ | ✅ | ✅ |
| update template | ❌ | ✅ | ✅ |

---

# Contacts

| פעולה | partner | maintenanceManager | admin |
|------|--------|--------------------|------|
| view | ✅ | ✅ | ✅ |
| create | ❌ | ✅ | ✅ |
| edit | ❌ | ✅ | ✅ |

---

# Feedback Reports

| פעולה | partner | admin |
|------|--------|------|
| create report | ✅ | ✅ |
| view own | ✅ | ✅ |
| view all | ❌ | ✅ |
| update status | ❌ | ✅ |

---

# Audit Logs

| פעולה | partner | admin |
|------|--------|------|
| view | ❌ | ✅ |

---

# System Settings

| פעולה | partner | admin |
|------|--------|------|
| view | ❌ | ✅ |
| update | ❌ | ✅ |

---

# Backup / Restore

| פעולה | partner | admin |
|------|--------|------|
| create backup | ❌ | ✅ |
| restore backup | ❌ | ✅ |

---

# Onboarding Permissions

| פעולה | כל user רשום |
|-------|------------|
| create new boat | ✅ |
| accept invitation | ✅ |
| switch active boat | ✅ (אם member) |

---

# Sensitive Operations Requiring Server Enforcement

הפעולות הבאות חייבות להתבצע דרך Cloud Functions בלבד:

- create boat
- invite partner
- accept invitation
- remove member
- change member role
- create booking
- cancel booking
- join partner sail
- manual credit adjustment
- create charge
- publish charge
- create partner invoices
- register payment
- freeze partner (financial)
- unfreeze partner
- restore backup
- create maintenance block

---

# Financial Freeze Behavior

כאשר `partners.financialStatus = 'frozen'`:

❌ לא יכול ליצור booking
❌ לא יכול להצטרף ל-partner sail

✅ יכול לראות נתונים
✅ יכול לשלוח דיווח feedback
