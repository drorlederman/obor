# Firestore Indexes Plan

מסמך זה מגדיר את האינדקסים המומלצים עבור Firestore בפרויקט OBOR.

## Goals
- למנוע שגיאות query נפוצות
- להכין מראש אינדקסים למסכים המרכזיים
- לשפר ביצועים במסכי רשימות, יומן, פיננסים ותחזוקה

## General Principles
- **כל query מתחיל ב-`boatId`** — זהו עיקרון בידוד ה-tenants
- sorting + filtering משולבים דורשים composite indexes
- אין למשוך collections שלמות ללא סינון לפי `boatId`
- אם יש ספק, עדיף אינדקס ממוקד למסך משמעותי

---

## 1. boat_members

### Query Patterns
- כל הסירות של משתמש
- כל החברים הפעילים בסירה
- חברים לפי role בסירה

### Recommended Indexes

#### user memberships
- `userId ASC, status ASC`

שימוש: טעינת כל הסירות שמשתמש חבר בהן (לmenu בחירת סירה)

#### active members in boat
- `boatId ASC, status ASC`

שימוש: רשימת שותפים פעילים

#### members by role
- `boatId ASC, role ASC, status ASC`

שימוש: סינון לפי תפקיד

---

## 2. invitations

### Query Patterns
- הזמנות ממתינות בסירה
- הזמנות לפי email
- lookup לפי token

### Recommended Indexes

#### pending invitations per boat
- `boatId ASC, status ASC, createdAt DESC`

שימוש: מסך ניהול הזמנות

#### email lookup
- `email ASC, status ASC`

שימוש: בדיקת קיום הזמנה לפני שליחה חדשה

#### token lookup
- `token ASC`

שימוש: אימות הזמנה בקבלתה (unique lookup)

---

## 3. bookings

### Query Patterns
- הזמנות לפי סירה בטווח זמן
- הזמנות של שותף לפי תאריך
- הזמנות פעילות
- maintenance blocks בטווח זמן

### Recommended Indexes

#### calendar view
- `boatId ASC, startTime ASC`

שימוש: טעינת יומן לחודש / שבוע

#### owner history
- `boatId ASC, ownerPartnerId ASC, startTime DESC`

שימוש: היסטוריית הזמנות של שותף

#### active bookings
- `boatId ASC, status ASC, startTime ASC`

שימוש: הזמנות פעילות

#### by type
- `boatId ASC, type ASC, status ASC, startTime ASC`

שימוש: maintenance_block / partner_sail filtering

---

## 4. credit_transactions

### Query Patterns
- ledger של שותף בסירה
- תנועות לפי סוג

### Recommended Indexes

#### partner ledger
- `boatId ASC, partnerId ASC, createdAt DESC`

שימוש: מסך מטבעות של שותף

#### partner + type
- `boatId ASC, partnerId ASC, type ASC, createdAt DESC`

שימוש: פילטור refund / adjustment

---

## 5. charges

### Query Patterns
- חיובים אחרונים בסירה
- חיובים לפי סטטוס

### Recommended Indexes

#### recent charges
- `boatId ASC, createdAt DESC`

שימוש: רשימת חיובים

#### by status
- `boatId ASC, status ASC, dueDate ASC`

שימוש: חיובים פתוחים / published

---

## 6. partner_invoices

### Query Patterns
- חשבוניות של שותף
- חשבוניות פתוחות/באיחור
- תצוגת גבייה

### Recommended Indexes

#### partner invoices
- `boatId ASC, partnerId ASC, dueDate DESC`

שימוש: מסך החשבוניות של שותף

#### partner + status
- `boatId ASC, partnerId ASC, status ASC, dueDate DESC`

שימוש: סינון לפי סטטוס

#### overdue tracking
- `boatId ASC, status ASC, dueDate ASC`

שימוש: מעקב overdue

#### by charge
- `boatId ASC, chargeId ASC, partnerId ASC`

שימוש: בדיקת חשבוניות שנוצרו מ-charge

---

## 7. payments

### Query Patterns
- תשלומים של שותף
- תשלומים לפי חשבונית

### Recommended Indexes

#### partner payments
- `boatId ASC, partnerId ASC, paidAt DESC`

שימוש: היסטוריית תשלומים

#### invoice payments
- `boatId ASC, invoiceId ASC, paidAt DESC`

שימוש: פירוט תשלומים של חשבונית

#### method filter
- `boatId ASC, method ASC, paidAt DESC`

שימוש: treasurer filters

---

## 8. maintenance_tickets

### Query Patterns
- כל הקריאות הפעילות
- קריאות לפי סטטוס / עדיפות / קטגוריה

### Recommended Indexes

#### main list
- `boatId ASC, status ASC, updatedAt DESC`

שימוש: מסך תחזוקה ראשי

#### priority sort
- `boatId ASC, priority ASC, status ASC, createdAt DESC`

שימוש: מיון לפי דחיפות

#### advanced filter
- `boatId ASC, category ASC, status ASC, createdAt DESC`

שימוש: סינון לפי קטגוריה

#### dashboard alerts
- `boatId ASC, priority ASC, status ASC, createdAt DESC`

שימוש: קריאות קריטיות ל-dashboard

---

## 9. maintenance_updates

### Query Patterns
- עדכונים לפי ticket (timeline)

### Recommended Indexes

#### ticket timeline
- `boatId ASC, ticketId ASC, createdAt ASC`

שימוש: ציר זמן של קריאה

---

## 10. announcements

### Query Patterns
- הודעות פעילות בסירה
- לפי priority

### Recommended Indexes

#### active announcements
- `boatId ASC, isActive ASC, createdAt DESC`

שימוש: dashboard ורשימת הודעות

#### active + priority
- `boatId ASC, isActive ASC, priority ASC, createdAt DESC`

שימוש: הדגשת הודעות דחופות

---

## 11. checklists

### Recommended Indexes

#### type + active
- `boatId ASC, type ASC, isActive ASC, updatedAt DESC`

שימוש: בחירת checklist לתפעול

---

## 12. checklist_runs

### Recommended Indexes

#### booking runs
- `boatId ASC, bookingId ASC, completedAt DESC`

שימוש: checklist עבור הזמנה

#### checklist history
- `boatId ASC, checklistId ASC, completedAt DESC`

שימוש: היסטוריית ביצועים

---

## 13. contacts

### Recommended Indexes

#### active contacts
- `boatId ASC, isActive ASC, name ASC`

שימוש: ספר טלפונים

#### by category
- `boatId ASC, category ASC, isActive ASC, name ASC`

שימוש: פילטור לפי מרינה / חירום

---

## 14. feedback_reports

### Recommended Indexes

#### user reports
- `boatId ASC, userId ASC, createdAt DESC`

שימוש: משתמש רואה דיווחים שלו

#### status queue
- `boatId ASC, status ASC, createdAt DESC`

שימוש: admin triage

#### type + status
- `boatId ASC, type ASC, status ASC, createdAt DESC`

שימוש: פילטרים

---

## 15. audit_logs

### Recommended Indexes

#### entity timeline
- `boatId ASC, entityType ASC, entityId ASC, createdAt DESC`

שימוש: מעקב היסטוריה של ישות

#### actor timeline
- `boatId ASC, performedByUserId ASC, createdAt DESC`

שימוש: מעקב פעולות משתמש

#### action timeline
- `boatId ASC, action ASC, createdAt DESC`

שימוש: audit filtering

---

## High Priority Indexes for MVP

יש ליצור קודם כל את האינדקסים הבאים:

1. `boat_members: userId ASC, status ASC`
2. `boat_members: boatId ASC, status ASC`
3. `invitations: boatId ASC, status ASC, createdAt DESC`
4. `bookings: boatId ASC, startTime ASC`
5. `bookings: boatId ASC, status ASC, startTime ASC`
6. `credit_transactions: boatId ASC, partnerId ASC, createdAt DESC`
7. `partner_invoices: boatId ASC, partnerId ASC, status ASC, dueDate DESC`
8. `partner_invoices: boatId ASC, status ASC, dueDate ASC`
9. `payments: boatId ASC, invoiceId ASC, paidAt DESC`
10. `maintenance_tickets: boatId ASC, status ASC, updatedAt DESC`
11. `maintenance_updates: boatId ASC, ticketId ASC, createdAt ASC`
12. `announcements: boatId ASC, isActive ASC, createdAt DESC`
13. `audit_logs: boatId ASC, entityType ASC, entityId ASC, createdAt DESC`

---

## Notes for Claude

- כל אינדקס חייב להתחיל ב-`boatId ASC` — זהו עיקרון מוחלט
- לא לייצר כל אינדקס אפשרי — להתחיל מהרשימה כאן
- לשמור את `firestore.indexes.json` נקי ומינימלי
- אם המימוש משנה עיצוב queries, לעדכן מסמך זה ואת ה-JSON
