# Development Tasks

מפת עבודה מומלצת ל-Claude Code.

---

## Phase 1 — Planning
### Goals
- להציע folder structure
- להציע route map
- להציע data model
- להציע reusable component inventory
- להציע Cloud Functions plan
- להציע Security Rules strategy

### Deliverables
- `docs/architecture.md`
- `docs/routes.md`
- `docs/component-inventory.md`
- `firestore.indexes.json`
- `firestore.rules` draft
- `functions/README.md`

---

## Phase 2 — Project Scaffold
### Goals
- הקמת פרויקט Vite + React + TypeScript
- Tailwind setup
- RTL shell
- Theme provider
- Dark mode toggle
- Layouts
- Navigation

### Deliverables
- App shell
- Mobile bottom tabs
- Desktop sidebar
- Route placeholders
- Global providers

---

## Phase 3 — Authentication & Access Foundation
### Goals
- Firebase Auth
- Auth context
- Protected routes
- Role guards
- Active/removed/frozen handling

### Deliverables
- Login screen
- Session handling
- Route guard utilities
- Current user bootstrap

---

## Phase 4 — Partner Management Foundation
### Goals
- users + partners integration
- partner list
- partner details
- admin create/edit/freeze/remove flows

### Deliverables
- Partners screen
- Partner form
- Role/status editing
- Audit log hooks

---

## Phase 5 — Booking Calendar
### Goals
- Month/week/day calendar
- Create booking
- Cancel booking
- Join partner sail
- Maintenance blocks
- Overlap validation

### Deliverables
- Calendar screens
- Booking form dialog
- Booking cards
- Booking validation flow
- Booking Cloud Functions

---

## Phase 6 — Credits
### Goals
- Credit balances
- Ledger history
- Automatic debit/refund
- Manual admin adjustment

### Deliverables
- Credits screen
- Ledger table/list
- Credit adjustment dialog
- Credit transaction integration

---

## Phase 7 — Finance
### Goals
- Charges
- Partner invoices
- Payments
- Overdue handling
- Financial freeze

### Deliverables
- Charges screen
- Invoices screen
- Payments screen
- Partner balance views
- Finance Cloud Functions

---

## Phase 8 — Maintenance
### Goals
- Ticket creation
- Attachments
- Priority/status flows
- Update history

### Deliverables
- Maintenance list
- Ticket details
- Ticket creation form
- Status update flow
- Storage integration

---

## Phase 9 — Announcements / Checklists / Contacts / Feedback
### Goals
- Announcements module
- Checklist templates
- Checklist execution
- Important contacts
- Feedback module

### Deliverables
- Announcement UI
- Checklist UI
- Contacts UI
- Feedback form and admin list

---

## Phase 10 — Admin / Settings / Backup
### Goals
- System settings
- Audit log UI
- Backup generation
- Restore with confirmation

### Deliverables
- Admin dashboard
- Settings screens
- Backup actions
- Restore safeguards

---

## Phase 11 — Weather Integration
### Goals
- Weather abstraction
- Dashboard weather widget
- Windy integration placeholder/service

### Deliverables
- Weather service layer
- Dashboard widget
- Error/loading states

---

## Phase 12 — Polish
### Goals
- Loading states
- Error boundaries
- Empty states
- Accessibility pass
- Hebrew copy consistency
- Mobile UX improvements
- Cleanup and refactor

### Deliverables
- Final UX polish
- Consistent copy
- Cleaner code structure
- Better resilience

---

## Definition of Done
כל phase נחשב גמור רק אם:
- הקוד נבנה ללא שגיאות
- אין placeholder שבור במסך
- יש loading state
- יש empty state
- יש error state
- טקסטי UI בעברית
- RTL תקין
- אין bypass לוגי בצד לקוח לפעולה רגישה
- יש טיפוסיות TypeScript סבירה