# Data Seeding Plan

מסמך זה מגדיר כיצד ליצור seed data לפרויקט OBOR לצורכי פיתוח, דמו ובדיקות.

## Goals

- לאפשר סביבת פיתוח עשירה כבר מההתחלה
- לאפשר בדיקות role-based אמיתיות
- לאפשר הדגמה של מסכים מרכזיים
- לשקף ארכיטקטורת multi-tenant אמיתית עם מספר סירות
- לעזור ל-Claude ליצור seed scripts מסודרים

---

# Principles

- seed data מיועד לפיתוח ודמו בלבד
- אין להשתמש בנתונים אמיתיים
- כל הנתונים יהיו דוגמתיים וברורים
- ה-seed צריך לשקף תרחישים אמיתיים
- יש לייצר נתונים בעברית בשכבת ה-UI, שדות DB נשארים באנגלית
- **כל document (למעט users) חייב לכלול boatId**

---

# 1. Seed Environments

## development

dataset עשיר — 2 סירות, משתמשים עם memberships שונים.

## demo

dataset אטרקטיבי להצגת המערכת — סירה אחת עם dashboard מלא.

## test

dataset קטן ודטרמיניסטי לבדיקות אוטומטיות.

---

# 2. Seed Users

יש ליצור 6 משתמשים גלובליים.

**שים לב: `users` אינו מכיל role — תפקיד מוגדר ב-`boat_members`.**

| email | fullName | הערות |
|-------|----------|-------|
| `admin@obor.dev` | אדמין ראשי | admin בסירה A |
| `scheduler@obor.dev` | מתזמן ראשי | scheduler בסירה A |
| `treasurer@obor.dev` | גזבר ראשי | treasurer בסירה A |
| `maintenance@obor.dev` | איש תחזוקה | maintenanceManager בסירה A |
| `partner1@obor.dev` | שותף ראשון | partner בסירה A |
| `partner2@obor.dev` | שותף שני | partner בסירה A + admin בסירה B |

---

# 3. Seed Boats

יש ליצור 2 סירות לצורכי dev.

## Boat A — הסירה הראשית

- `name: "OBOR"`
- `code: "obor-main"`
- `status: "active"`
- `homeMarina: "מרינה תל אביב"`
- `ownerUserId`: admin user

## Boat B — סירה שניה (לבדיקת multi-tenant isolation)

- `name: "ספינה שניה"`
- `code: "boat-b"`
- `status: "active"`
- `homeMarina: "מרינה הרצליה"`
- `ownerUserId`: partner2 user

### מטרת סירה B

לאפשר בדיקה שחברי סירה A לא יכולים לגשת לנתוני סירה B.

---

# 4. Seed Boat Members

## Boat A

| userId | role | status | partnerId |
|--------|------|--------|-----------|
| admin | admin | active | partners/a-admin |
| scheduler | scheduler | active | partners/a-scheduler |
| treasurer | treasurer | active | partners/a-treasurer |
| maintenance | maintenanceManager | active | partners/a-maintenance |
| partner1 | partner | active | partners/a-p1 |
| partner2 | partner | active | partners/a-p2 |

## Boat B

| userId | role | status | partnerId |
|--------|------|--------|-----------|
| partner2 | admin | active | partners/b-admin |

---

# 5. Seed Partners

## Boat A Partners

יש לכלול מגוון מצבים:

| fullName | financialStatus | weekdayCr | weekendCr |
|----------|----------------|-----------|-----------|
| אדמין ראשי | active | 40 | 20 |
| מתזמן ראשי | active | 35 | 15 |
| גזבר ראשי | active | 30 | 12 |
| איש תחזוקה | active | 28 | 10 |
| שותף ראשון | overdue | 5 | 2 |
| שותף שני | frozen | 0 | 0 |

## Boat B Partners

| fullName | financialStatus | weekdayCr | weekendCr |
|----------|----------------|-----------|-----------|
| שותף שני | active | 20 | 8 |

---

# 6. Seed Invitations

יש ליצור לפחות 2 הזמנות לסירה A:

- הזמנה `pending` לאימייל חדש שטרם הצטרף
- הזמנה `expired` לצורך בדיקת מסך שגיאה
- הזמנה `accepted` (היסטורית)

---

# 7. Seed Bookings (Boat A)

יש ליצור מגוון הזמנות עם `boatId = boatA`:

- הזמנה פרטית עתידית
- הזמנת `partner_sail` עתידית עם אפשרות הצטרפות
- שימוש בעגינה
- הזמנה שהושלמה בעבר
- הזמנה שבוטלה
- `maintenance_block` עתידי
- הזמנה קרובה להיום לצורך dashboard

## Time distribution

- חלק בעבר
- חלק היום
- חלק בעתיד הקרוב
- חלק בעתיד הרחוק

---

# 8. Seed Credit Transactions (Boat A)

יש ליצור ledger שמסביר את מצב היתרות.

לכל partner: לפחות 3 תנועות מסוגים שונים:

- `debit` על הזמנה
- `refund` על ביטול
- `credit` זיכוי פתיחה
- `adjustment` התאמה ידנית

---

# 9. Seed Charges / Invoices / Payments (Boat A)

## Charges

לפחות 3 חיובים:

1. דמי מרינה — `published`
2. תחזוקת מנוע — `published`
3. רכישת ציוד בטיחות — `draft`

## Invoices

מכל `published` charge → invoice לכל 6 שותפי סירה A.

## Payments — מגוון סטטוסים

- invoice פתוחה
- invoice ששולמה חלקית
- invoice ששולמה במלואה
- invoice באיחור (שותף overdue)

---

# 10. Seed Maintenance (Boat A)

לפחות 6 קריאות עם כיסוי של כל הקטגוריות, עדיפויות וסטטוסים.

- קריאה קריטית פתוחה לdashboard
- קריאה בטיפול עם כמה updates
- קריאה סגורה מהעבר

---

# 11. Seed Maintenance Updates (Boat A)

לכל ticket מרכזי: 1-4 updates עם timestamps כרונולוגיים.

---

# 12. Seed Announcements (Boat A)

לפחות 4 הודעות:

- הודעה כללית פעילה
- הודעה חשובה פעילה
- הודעה דחופה פעילה
- הודעה שפג תוקפה

---

# 13. Seed Checklists (Boat A)

- checklist `pre_sail` — 5-8 items
- checklist `post_sail` — 5-8 items
- checklist `maintenance` — 5-8 items

---

# 14. Seed Contacts (Boat A)

לפחות 6 אנשי קשר בקטגוריות: marina, emergency, supplier, service, general.

---

# 15. Seed Feedback Reports (Boat A)

לפחות 5 דיווחים עם כיסוי types ו-statuses שונים.

---

# 16. Seed Audit Logs (Boat A)

audit logs מייצגים לפעולות:

- `boat_created`
- `invitation_sent`
- `member_joined`
- `booking_created`
- `booking_cancelled`
- `credits_adjusted`
- `charge_created`
- `payment_registered`
- `partner_frozen`
- `maintenance_status_changed`
- `backup_created`

---

# 17. Seed System Settings (Both Boats)

לכל סירה:

## system_settings/{boatId}_credits

- `boatId`
- `blockHours: 3`
- `weekendDays: [5, 6]`
- `defaultWeekendMultiplier: 1`

## system_settings/{boatId}_notifications

- `boatId`
- `paymentReminderEnabled: true`
- `maintenanceAlertEnabled: true`
- `weatherAlertEnabled: true`

## system_settings/{boatId}_weather

- `boatId`
- `provider: "windy"`
- `isEnabled: true`
- `lastSyncAt: null`

---

# 18. Hebrew Seed Copy Guidelines

יש להשתמש בתוכן עברי אמיתי:

- `title: "בדיקת מערכת החשמל לפני יציאה"`
- `title: "תקלה במשאבת מי ים"`
- `title: "הודעה על עבודות תחזוקה ביום שישי"`

אין להשתמש ב-lorem ipsum או באנגלית בטקסטים גלויים.

---

# 19. Seed Script Structure

```text
scripts/
  seed/
    seed-dev.ts
    seed-demo.ts
    seed-test.ts
    data/
      users.seed.ts
      boats.seed.ts
      boat-members.seed.ts
      partners.seed.ts
      invitations.seed.ts
      bookings.seed.ts
      credits.seed.ts
      finance.seed.ts
      maintenance.seed.ts
      announcements.seed.ts
      checklists.seed.ts
      contacts.seed.ts
      feedback.seed.ts
      audit.seed.ts
      settings.seed.ts
```

---

# 20. Multi-Tenant Isolation Test

לאחר ה-seed, יש לאמת:

- ✅ admin@obor.dev יכול לראות נתוני סירה A
- ✅ partner2@obor.dev יכול לראות נתוני סירה A וB
- ❌ partner1@obor.dev לא יכול לראות נתוני סירה B
- ❌ admin@obor.dev לא יכול לראות נתוני סירה B
