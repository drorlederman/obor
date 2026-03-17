
---

## `docs/ui-copy-hebrew.md`

```md
# UI Copy Hebrew

מסמך זה מגדיר טרמינולוגיה אחידה בעברית עבור OBOR.

## Rules
- כל טקסט למשתמש בעברית
- להשתמש במונחים אחידים בכל האפליקציה
- להימנע מתרגומים שונים לאותו מושג
- להעדיף עברית פשוטה, ברורה וקצרה
- לא להשתמש בז'רגון טכני מול המשתמש

---

## App Name
- OBOR
- One Boat One Responsibility

בממשק אפשר להציג:
- OBOR
- או OBOR - One Boat One Responsibility

---

## Main Navigation Terms

| English Concept | Hebrew UI Copy |
|---|---|
| Dashboard | לוח בקרה |
| Bookings Calendar | יומן הזמנות |
| Bookings | הזמנות |
| Credits | מטבעות |
| Finance | פיננסים |
| Maintenance | תחזוקה |
| Announcements | הודעות |
| Checklists | צ'קליסטים |
| Important Contacts | אנשי קשר חשובים |
| Feedback | פידבק |
| Profile | פרופיל |
| Partners | שותפים |
| Settings | הגדרות |
| Audit Log | לוג ביקורת |
| Backup & Restore | גיבוי ושחזור |
| More | עוד |

---

## General Actions

| English | Hebrew |
|---|---|
| Save | שמירה |
| Cancel | ביטול |
| Close | סגירה |
| Confirm | אישור |
| Delete | מחיקה |
| Edit | עריכה |
| Update | עדכון |
| Create | יצירה |
| Add | הוספה |
| Remove | הסרה |
| Search | חיפוש |
| Filter | סינון |
| Clear | ניקוי |
| Reset | איפוס |
| Submit | שליחה |
| Retry | ניסיון חוזר |
| Refresh | רענון |
| Back | חזרה |
| Continue | המשך |
| View details | צפייה בפרטים |

---

## Auth

| English | Hebrew |
|---|---|
| Login | התחברות |
| Sign in | התחברות |
| Email | דוא"ל |
| Password | סיסמה |
| Logout | התנתקות |
| Magic link | קישור התחברות |
| Invalid credentials | פרטי ההתחברות שגויים |
| Session expired | פג תוקף ההתחברות, יש להתחבר מחדש |

---

## Dashboard

| English | Hebrew |
|---|---|
| Today's bookings | ההזמנות של היום |
| Credit summary | סיכום מטבעות |
| Maintenance alerts | התראות תחזוקה |
| Active announcements | הודעות פעילות |
| Weather | מזג אוויר |
| Sea conditions | תנאי ים |

---

## Bookings

| English | Hebrew |
|---|---|
| New booking | הזמנה חדשה |
| Create booking | יצירת הזמנה |
| Cancel booking | ביטול הזמנה |
| Booking details | פרטי הזמנה |
| Booking owner | בעל ההזמנה |
| Start time | שעת התחלה |
| End time | שעת סיום |
| Duration | משך זמן |
| Participants | משתתפים |
| Notes | הערות |
| Booking type | סוג הזמנה |
| Join sail | הצטרפות לשיט |
| Maintenance block | חסימת תחזוקה |

### Booking Types
| Internal Value | Hebrew |
|---|---|
| private_sail | שיט פרטי |
| partner_sail | שיט שותפים |
| marina_use | שימוש בעגינה |
| maintenance_block | חסימת תחזוקה |

### Booking Messages
| Situation | Hebrew |
|---|---|
| Booking created successfully | ההזמנה נוצרה בהצלחה |
| Booking cancelled successfully | ההזמנה בוטלה בהצלחה |
| You do not have enough credits | אין לך מספיק מטבעות לביצוע ההזמנה |
| This time slot is already taken | טווח הזמן הזה כבר תפוס |
| Cannot book during maintenance block | לא ניתן להזמין בזמן חסימת תחזוקה |
| Only the owner can cancel this booking | רק בעל ההזמנה יכול לבטל אותה |
| Joined successfully | ההצטרפות בוצעה בהצלחה |

---

## Credits

| English | Hebrew |
|---|---|
| Credit balance | יתרת מטבעות |
| Weekday credits | מטבעות לימי חול |
| Weekend credits | מטבעות לסוף שבוע |
| Ledger history | היסטוריית תנועות |
| Manual adjustment | התאמה ידנית |
| Refund | החזר |
| Debit | חיוב |
| Credit | זיכוי |

### Credit Messages
| Situation | Hebrew |
|---|---|
| Credits updated successfully | המטבעות עודכנו בהצלחה |
| A description is required for manual adjustment | חובה להזין תיאור להתאמה ידנית |

---

## Finance

| English | Hebrew |
|---|---|
| Charges | חיובים |
| Invoices | חשבוניות |
| Payments | תשלומים |
| Partner balance | מצב חשבון |
| Due date | מועד לתשלום |
| Amount | סכום |
| Amount paid | סכום ששולם |
| Remaining balance | יתרה לתשלום |
| Payment method | אמצעי תשלום |
| Partial payment | תשלום חלקי |
| Overdue | באיחור |
| Frozen | מוקפא |

### Payment Methods
| Internal Value | Hebrew |
|---|---|
| cash | מזומן |
| bank_transfer | העברה בנקאית |
| card | כרטיס אשראי |

### Finance Statuses
| Internal Value | Hebrew |
|---|---|
| open | פתוח |
| partial | שולם חלקית |
| paid | שולם |
| overdue | באיחור |
| frozen | מוקפא |

### Finance Messages
| Situation | Hebrew |
|---|---|
| Charge created successfully | החיוב נוצר בהצלחה |
| Payment registered successfully | התשלום נרשם בהצלחה |
| This partner is financially frozen | השותף מוקפא פיננסית |
| You cannot create a booking while your account is frozen | לא ניתן ליצור הזמנה כאשר החשבון שלך מוקפא |

---

## Maintenance

| English | Hebrew |
|---|---|
| Maintenance ticket | קריאת תחזוקה |
| New ticket | קריאה חדשה |
| Category | קטגוריה |
| Priority | עדיפות |
| Status | סטטוס |
| Description | תיאור |
| Attachments | קבצים מצורפים |
| Update log | יומן עדכונים |
| Assign | שיוך |
| Resolve | סימון כטופל |
| Close ticket | סגירת קריאה |

### Categories
| Internal Value | Hebrew |
|---|---|
| engine | מנוע |
| sails | מפרשים |
| electrical | חשמל |
| hull | גוף הסירה |
| safety | בטיחות |
| general | כללי |

### Priorities
| Internal Value | Hebrew |
|---|---|
| low | נמוכה |
| medium | בינונית |
| high | גבוהה |
| critical | קריטית |

### Statuses
| Internal Value | Hebrew |
|---|---|
| open | פתוחה |
| in_progress | בטיפול |
| waiting_parts | ממתינה לחלקים |
| resolved | טופלה |
| closed | נסגרה |

### Maintenance Messages
| Situation | Hebrew |
|---|---|
| Ticket created successfully | קריאת התחזוקה נפתחה בהצלחה |
| Status updated successfully | הסטטוס עודכן בהצלחה |
| Only authorized users can change ticket status | רק משתמשים מורשים יכולים לשנות את סטטוס הקריאה |

---

## Announcements

| English | Hebrew |
|---|---|
| Announcement | הודעה |
| New announcement | הודעה חדשה |
| Priority | עדיפות |
| Expiration date | תאריך תפוגה |
| Publish | פרסום |
| Active | פעילה |
| Expired | פגה |

### Announcement Priorities
| Internal Value | Hebrew |
|---|---|
| info | מידע |
| important | חשובה |
| urgent | דחופה |

---

## Checklists

| English | Hebrew |
|---|---|
| Checklist | צ'קליסט |
| Checklist run | ביצוע צ'קליסט |
| Pre-sail checklist | צ'קליסט לפני הפלגה |
| Post-sail checklist | צ'קליסט אחרי הפלגה |
| Maintenance checklist | צ'קליסט תחזוקה |
| Mark as complete | סימון כהושלם |
| Required item | סעיף חובה |

---

## Contacts

| English | Hebrew |
|---|---|
| Contacts | אנשי קשר |
| Important contacts | אנשי קשר חשובים |
| Name | שם |
| Role | תפקיד |
| Phone | טלפון |
| Email | דוא"ל |
| Call | חיוג |
| Send email | שליחת דוא"ל |

---

## Feedback

| English | Hebrew |
|---|---|
| Report a bug | דיווח על תקלה |
| Feature request | בקשת פיצ'ר |
| General feedback | פידבק כללי |
| Title | כותרת |
| Message | הודעה |
| Send report | שליחת דיווח |

### Feedback Types
| Internal Value | Hebrew |
|---|---|
| bug | תקלה |
| feature | בקשת פיצ'ר |
| general | כללי |

### Feedback Messages
| Situation | Hebrew |
|---|---|
| Report sent successfully | הדיווח נשלח בהצלחה |
| Please fill in all required fields | יש למלא את כל השדות החובה |

---

## Partners

| English | Hebrew |
|---|---|
| Partners | שותפים |
| Add partner | הוספת שותף |
| Edit partner | עריכת שותף |
| Freeze partner | הקפאת שותף |
| Remove partner | הסרת שותף |
| Active | פעיל |
| Removed | הוסר |

### Partner Status / Finance Labels
| Internal Value | Hebrew |
|---|---|
| active | פעיל |
| frozen | מוקפא |
| removed | הוסר |
| overdue | באיחור |

---

## Settings

| English | Hebrew |
|---|---|
| System settings | הגדרות מערכת |
| Notification settings | הגדרות התראות |
| Credits settings | הגדרות מטבעות |
| Weather settings | הגדרות מזג אוויר |
| Save changes | שמירת שינויים |

---

## Backup & Restore

| English | Hebrew |
|---|---|
| Create backup | יצירת גיבוי |
| Restore backup | שחזור גיבוי |
| Backup history | היסטוריית גיבויים |
| Confirm restore | אישור שחזור |
| This action cannot be undone | לא ניתן לבטל פעולה זו |

### Backup Messages
| Situation | Hebrew |
|---|---|
| Backup created successfully | הגיבוי נוצר בהצלחה |
| Restore completed successfully | השחזור הושלם בהצלחה |
| Restore failed | השחזור נכשל |

---

## Audit

| English | Hebrew |
|---|---|
| Audit log | לוג ביקורת |
| Action | פעולה |
| Entity type | סוג ישות |
| Performed by | בוצע על ידי |
| Date and time | תאריך ושעה |
| Details | פרטים |

---

## Common Empty States

| Situation | Hebrew |
|---|---|
| No bookings found | לא נמצאו הזמנות |
| No announcements right now | אין הודעות כרגע |
| No maintenance tickets found | לא נמצאו קריאות תחזוקה |
| No payments found | לא נמצאו תשלומים |
| No contacts found | לא נמצאו אנשי קשר |
| No feedback reports found | לא נמצאו דיווחים |

---

## Common Loading States

| Situation | Hebrew |
|---|---|
| Loading | טוען... |
| Saving | שומר... |
| Sending | שולח... |
| Updating | מעדכן... |
| Creating | יוצר... |
| Deleting | מוחק... |

---

## Common Error Messages

| Situation | Hebrew |
|---|---|
| Something went wrong | משהו השתבש |
| Failed to load data | טעינת הנתונים נכשלה |
| Failed to save changes | שמירת השינויים נכשלה |
| You do not have permission to perform this action | אין לך הרשאה לבצע פעולה זו |
| The requested page was not found | הדף המבוקש לא נמצא |
| Please try again later | יש לנסות שוב מאוחר יותר |

---

## Confirmation Dialogs

### Delete
- כותרת: `האם למחוק?`
- תיאור: `לאחר המחיקה לא ניתן יהיה לשחזר את הנתון.`
- כפתור אישור: `מחיקה`
- כפתור ביטול: `ביטול`

### Cancel Booking
- כותרת: `לבטל את ההזמנה?`
- תיאור: `ביטול ההזמנה יחזיר את המטבעות בהתאם לכללי המערכת.`
- כפתור אישור: `כן, לבטל`
- כפתור ביטול: `חזרה`

### Restore Backup
- כותרת: `לבצע שחזור מגיבוי?`
- תיאור: `פעולה זו עלולה לדרוס נתונים קיימים.`
- כפתור אישור: `כן, לבצע שחזור`
- כפתור ביטול: `ביטול`

---

## Tone Guidelines
- לכתוב בעברית ברורה, עניינית וידידותית
- לא להשתמש בשפה משפטית או טכנית מדי
- שגיאות צריכות להסביר מה הבעיה, לא רק שמשהו נכשל
- הצלחות צריכות להיות קצרות וברורות