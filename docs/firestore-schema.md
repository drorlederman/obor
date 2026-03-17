# Firestore Schema

מסמך זה מגדיר את מודל הנתונים הראשי של OBOR.

## General Principles
- שמות collections באנגלית
- שמות fields באנגלית
- כל timestamps בפורמט Firestore Timestamp
- יש להעדיף מבנה שטוח וברור
- attachments יישמרו ב-Firebase Storage עם metadata ב-Firestore
- כל entity קריטי יקבל audit log
- **כל document (למעט `users`) חייב לכלול `boatId`** — עיקרון הבידוד הבסיסי של המערכת

---

## Multi-Tenancy Model

כל סירה היא tenant נפרד.

```
users (גלובלי — ללא role)
  └── boat_members (role + status per boat)
        └── boats (tenant root)
              ├── partners (credits, פיננסים)
              ├── bookings
              ├── credit_transactions
              ├── charges / partner_invoices / payments
              ├── maintenance_tickets / updates / attachments
              ├── announcements / checklists / checklist_runs
              ├── contacts / feedback_reports
              ├── audit_logs / system_settings / backups
invitations (הזמנות להצטרפות)
```

---

## 1. users

מייצג את המשתמש הגלובלי — פרטי זיהוי בלבד.

### Collection
`users`

### Document ID
`uid` של Firebase Auth

### Fields
- `email: string`
- `fullName: string`
- `phone: string | null`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`
- `lastLoginAt: Timestamp | null`

### Notes
- **אין `role`** — תפקיד מוגדר per-boat ב-`boat_members`
- **אין `partnerId`** — הקישור לסירה מנוהל דרך `boat_members`
- `users` הוא ה-profile הגלובלי בלבד

---

## 2. boats

מייצג סירה — ה-tenant root של המערכת.

### Collection
`boats`

### Fields
- `name: string`
- `code: string`
- `status: 'active' | 'maintenance' | 'inactive'`
- `homeMarina: string | null`
- `ownerUserId: string`
- `memberCount: number`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`

### Notes
- `ownerUserId` = המשתמש שיצר את הסירה (admin ראשון)
- `memberCount` מעודכן אוטומטית בכל שינוי חברות

---

## 3. boat_members

גשר בין משתמש לסירה — **מקור האמת לתפקיד ולסטטוס בסירה**.

### Collection
`boat_members`

### Document ID
`{userId}_{boatId}`

### Fields
- `boatId: string`
- `userId: string`
- `partnerId: string | null`
- `role: 'partner' | 'scheduler' | 'treasurer' | 'maintenanceManager' | 'admin'`
- `status: 'active' | 'frozen' | 'removed'`
- `invitedByUserId: string | null`
- `invitedAt: Timestamp | null`
- `joinedAt: Timestamp`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`

### Notes
- `partnerId` מצביע למסמך ב-`partners` (הישות העסקית)
- Custom Claims של Firebase Auth מסונכרנים עם `role` ו-`status` מ-collection זה
- `status = 'removed'` → חסום; לא למחוק (לשמור לhistory)

---

## 4. partners

ישות עסקית של שותף בסירה — credits ופיננסים.

### Collection
`partners`

### Fields
- `boatId: string`
- `userId: string | null`
- `fullName: string`
- `email: string`
- `phone: string | null`
- `status: 'active' | 'frozen' | 'removed'`
- `weekdayCreditsBalance: number`
- `weekendCreditsBalance: number`
- `financialStatus: 'active' | 'overdue' | 'frozen'`
- `joinedAt: Timestamp`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`
- `notes: string | null`

### Notes
- `boatId` חובה
- `userId` = null אם השותף הוזמן אך טרם הצטרף
- **אין `role`** — מקור האמת הוא `boat_members.role`

---

## 5. invitations

הזמנות לשותפים לצטרף לסירה.

### Collection
`invitations`

### Fields
- `boatId: string`
- `boatName: string`
- `email: string`
- `role: 'partner' | 'scheduler' | 'treasurer' | 'maintenanceManager' | 'admin'`
- `token: string`
- `status: 'pending' | 'accepted' | 'expired' | 'cancelled'`
- `invitedByUserId: string`
- `createdAt: Timestamp`
- `expiresAt: Timestamp`
- `acceptedAt: Timestamp | null`
- `acceptedByUserId: string | null`

### Notes
- `token` = מזהה ייחודי רנדומלי לקישור ההזמנה
- `expiresAt` = ברירת מחדל 7 ימים מיצירה
- הזמנה `accepted` אינה ניתנת לשימוש חוזר

---

## 6. bookings

הזמנות ליומן.

### Collection
`bookings`

### Fields
- `boatId: string`
- `createdByUserId: string`
- `ownerPartnerId: string`
- `type: 'private_sail' | 'partner_sail' | 'marina_use' | 'maintenance_block'`
- `status: 'active' | 'cancelled' | 'completed'`
- `title: string`
- `notes: string | null`
- `startTime: Timestamp`
- `endTime: Timestamp`
- `durationHours: number`
- `creditType: 'weekday' | 'weekend' | null`
- `creditsUsed: number`
- `participants: string[]`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`
- `cancelledAt: Timestamp | null`
- `cancelledByUserId: string | null`

---

## 7. credit_transactions

ספר מטבעות מלא.

### Collection
`credit_transactions`

### Fields
- `boatId: string`
- `partnerId: string`
- `bookingId: string | null`
- `type: 'debit' | 'credit' | 'refund' | 'adjustment'`
- `creditType: 'weekday' | 'weekend'`
- `amount: number`
- `balanceAfter: number`
- `description: string`
- `createdByUserId: string`
- `createdAt: Timestamp`

### Notes
- `amount` תמיד חיובי; המשמעות נקבעת לפי `type`

---

## 8. charges

חיוב קבוצתי שממנו נוצרת חשבונית לכל שותף.

### Collection
`charges`

### Fields
- `boatId: string`
- `title: string`
- `description: string | null`
- `category: 'maintenance' | 'marina' | 'insurance' | 'equipment' | 'general'`
- `totalAmount: number`
- `splitMethod: 'equal'`
- `dueDate: Timestamp`
- `status: 'draft' | 'published' | 'closed'`
- `createdByUserId: string`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`

---

## 9. partner_invoices

חשבונית פרטנית לכל שותף מתוך charge.

### Collection
`partner_invoices`

### Fields
- `boatId: string`
- `chargeId: string`
- `partnerId: string`
- `amount: number`
- `amountPaid: number`
- `amountRemaining: number`
- `status: 'open' | 'partial' | 'paid' | 'overdue' | 'frozen'`
- `dueDate: Timestamp`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`
- `lastPaymentAt: Timestamp | null`

---

## 10. payments

תשלומים על חשבוניות.

### Collection
`payments`

### Fields
- `boatId: string`
- `invoiceId: string`
- `partnerId: string`
- `amount: number`
- `method: 'cash' | 'bank_transfer' | 'card'`
- `reference: string | null`
- `notes: string | null`
- `paidAt: Timestamp`
- `createdByUserId: string`
- `createdAt: Timestamp`

---

## 11. maintenance_tickets

קריאות תחזוקה.

### Collection
`maintenance_tickets`

### Fields
- `boatId: string`
- `title: string`
- `description: string`
- `category: 'engine' | 'sails' | 'electrical' | 'hull' | 'safety' | 'general'`
- `priority: 'low' | 'medium' | 'high' | 'critical'`
- `status: 'open' | 'in_progress' | 'waiting_parts' | 'resolved' | 'closed'`
- `createdByUserId: string`
- `createdByPartnerId: string | null`
- `assignedToUserId: string | null`
- `attachmentCount: number`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`
- `resolvedAt: Timestamp | null`
- `closedAt: Timestamp | null`

---

## 12. maintenance_updates

יומן עדכונים לקריאות תחזוקה.

### Collection
`maintenance_updates`

### Fields
- `boatId: string`
- `ticketId: string`
- `comment: string`
- `statusBefore: string | null`
- `statusAfter: string | null`
- `createdByUserId: string`
- `createdAt: Timestamp`

---

## 13. maintenance_attachments

### Collection
`maintenance_attachments`

### Fields
- `boatId: string`
- `ticketId: string`
- `storagePath: string`
- `fileName: string`
- `contentType: string`
- `sizeBytes: number`
- `uploadedByUserId: string`
- `createdAt: Timestamp`

---

## 14. announcements

הודעות מערכת לשותפים.

### Collection
`announcements`

### Fields
- `boatId: string`
- `title: string`
- `content: string`
- `priority: 'info' | 'important' | 'urgent'`
- `isActive: boolean`
- `expiresAt: Timestamp | null`
- `createdByUserId: string`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`

---

## 15. checklists

תבניות צ'קליסט.

### Collection
`checklists`

### Fields
- `boatId: string`
- `type: 'pre_sail' | 'post_sail' | 'maintenance'`
- `title: string`
- `items: Array<{ id: string; text: string; required: boolean; sortOrder: number }>`
- `isActive: boolean`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`

---

## 16. checklist_runs

מופע ביצוע של checklist בפועל.

### Collection
`checklist_runs`

### Fields
- `boatId: string`
- `checklistId: string`
- `bookingId: string | null`
- `completedByUserId: string`
- `responses: Array<{ itemId: string; checked: boolean; note: string | null }>`
- `completedAt: Timestamp`

---

## 17. contacts

אנשי קשר חשובים.

### Collection
`contacts`

### Fields
- `boatId: string`
- `name: string`
- `roleLabel: string`
- `phone: string`
- `email: string | null`
- `notes: string | null`
- `category: 'marina' | 'emergency' | 'supplier' | 'service' | 'general'`
- `isActive: boolean`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`

---

## 18. feedback_reports

פידבק ודיווחי באגים.

### Collection
`feedback_reports`

### Fields
- `boatId: string`
- `userId: string`
- `partnerId: string | null`
- `type: 'bug' | 'feature' | 'general'`
- `title: string`
- `message: string`
- `status: 'new' | 'reviewing' | 'resolved' | 'closed'`
- `attachmentCount: number`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`

---

## 19. feedback_attachments

### Collection
`feedback_attachments`

### Fields
- `boatId: string`
- `feedbackId: string`
- `storagePath: string`
- `fileName: string`
- `contentType: string`
- `sizeBytes: number`
- `uploadedByUserId: string`
- `createdAt: Timestamp`

---

## 20. audit_logs

לוג ביקורת לפעולות קריטיות.

### Collection
`audit_logs`

### Fields
- `boatId: string`
- `action: string`
- `entityType: string`
- `entityId: string`
- `performedByUserId: string`
- `performedByRole: string`
- `targetPartnerId: string | null`
- `details: map`
- `createdAt: Timestamp`

### Examples
- `boat_created`
- `invitation_sent`
- `member_joined`
- `member_removed`
- `booking_created`
- `booking_cancelled`
- `credits_adjusted`
- `charge_created`
- `payment_registered`
- `partner_frozen`
- `backup_created`
- `restore_performed`

---

## 21. system_settings

הגדרות מערכת per-boat.

### Collection
`system_settings`

### Document ID Format
`{boatId}_{settingType}` — לדוגמה: `abc123_credits`

### Fields (משותף לכל מסמך)
- `boatId: string`
- `updatedAt: Timestamp`
- `updatedByUserId: string`

### credits settings
- `blockHours: number`
- `weekendDays: number[]`
- `defaultWeekendMultiplier: number | null`

### notifications settings
- `paymentReminderEnabled: boolean`
- `maintenanceAlertEnabled: boolean`
- `weatherAlertEnabled: boolean`

### weather settings
- `provider: 'windy'`
- `isEnabled: boolean`
- `lastSyncAt: Timestamp | null`

---

## 22. backups

metadata על גיבויים.

### Collection
`backups`

### Fields
- `boatId: string`
- `fileName: string`
- `storagePath: string`
- `createdByUserId: string`
- `createdAt: Timestamp`
- `status: 'ready' | 'failed'`
- `notes: string | null`

---

## Suggested Indexes

### boat_members
- `userId ASC, status ASC`
- `boatId ASC, status ASC`
- `boatId ASC, role ASC, status ASC`

### invitations
- `boatId ASC, status ASC, createdAt DESC`
- `email ASC, status ASC`
- `token ASC`

### bookings
- `boatId ASC, startTime ASC`
- `boatId ASC, ownerPartnerId ASC, startTime DESC`
- `boatId ASC, status ASC, startTime ASC`
- `boatId ASC, type ASC, status ASC, startTime ASC`

### credit_transactions
- `boatId ASC, partnerId ASC, createdAt DESC`

### partner_invoices
- `boatId ASC, partnerId ASC, status ASC, dueDate DESC`
- `boatId ASC, status ASC, dueDate ASC`

### payments
- `boatId ASC, partnerId ASC, paidAt DESC`
- `boatId ASC, invoiceId ASC, paidAt DESC`

### maintenance_tickets
- `boatId ASC, status ASC, updatedAt DESC`
- `boatId ASC, priority ASC, status ASC, createdAt DESC`

### maintenance_updates
- `boatId ASC, ticketId ASC, createdAt ASC`

### announcements
- `boatId ASC, isActive ASC, priority ASC, createdAt DESC`

### feedback_reports
- `boatId ASC, userId ASC, createdAt DESC`
- `boatId ASC, status ASC, createdAt DESC`

### audit_logs
- `boatId ASC, entityType ASC, entityId ASC, createdAt DESC`
- `boatId ASC, performedByUserId ASC, createdAt DESC`
