# Component Inventory

מסמך זה מגדיר את רשימת הקומפוננטים של ממשק המשתמש באפליקציית OBOR.

המטרה היא:
- לשמור על שפה עיצובית אחידה
- למנוע כפילויות UI
- לאפשר בנייה מודולרית
- להקל על Claude Code ליצור מסכים עקביים

כל הקומפוננטים בנויים מעל React ו-Tailwind.

---

# Component Categories

- Layout Components
- Navigation Components
- Onboarding Components
- Data Display Components
- Form Components
- Feedback Components
- Dialog Components
- Domain Components

---

# Layout Components

## AppLayout

המבנה הראשי של האפליקציה.

כולל:
- Header
- Sidebar (בדסקטופ)
- Bottom Navigation (במובייל)
- Main Content

Props:
- children

---

## PageLayout

מעטפת לעמוד.

כולל:
- Page Title
- Actions Area
- Content Container

Props:
- title
- subtitle
- actions
- children

---

## SectionCard

כרטיס להצגת מידע מקובץ.

Props:
- title
- icon
- actions
- children

---

## GridLayout

מערכת grid להצגת cards או widgets.

Props:
- columns
- gap
- children

---

# Navigation Components

## Sidebar

תפריט ניווט לדסקטופ.

כולל:
- BoatSwitcher בראש ה-sidebar
- קבוצות ניווט
- סימון route פעיל
- הרשאות לפי role

---

## BottomNavigation

ניווט מובייל.

Tabs:
- לוח בקרה
- יומן
- מטבעות
- תחזוקה
- עוד

---

## MobileMoreMenu

מסך "עוד" במובייל.

כולל:
- Finance
- Announcements
- Checklists
- Contacts
- Feedback
- Profile
- switch-boat (אם חבר ביותר מסירה אחת)

Admin options:
- Partners
- Settings
- Audit
- Backups

---

## BoatSwitcher

בחירת הסירה הפעילה.

Props:
- boats (רשימת memberships)
- activeBoatId
- onSwitch

שימוש:
- בראש ה-Sidebar בדסקטופ
- כ-link ב-MobileMoreMenu

---

# Onboarding Components

## WelcomeScreen

מסך ברוך הבא למשתמש חדש או ללא סירה.

כולל:
- כפתור יצירת סירה חדשה
- כפתור הצטרפות לסירה קיימת

---

## CreateBoatForm

טופס יצירת סירה חדשה.

Props:
- onSuccess

Fields:
- שם הסירה
- קוד / nickname
- מרינה ביתית

---

## InvitationAcceptCard

מסך קבלת הזמנה.

Props:
- invitation (boatName, role, invitedBy)
- onAccept
- onDecline

States:
- loading
- expired
- already_member
- success

---

## InvitationForm

טופס שליחת הזמנה.

Props:
- boatId
- onSuccess

Fields:
- email
- role

---

---

# Data Display Components

## DataTable

טבלה כללית.

Features:
- sorting
- filtering
- pagination
- responsive layout

Props:
- columns
- rows
- loading
- emptyState

---

## InfoCard

כרטיס להצגת נתון מרכזי.

Props:
- label
- value
- icon
- color

---

## Badge

תג סטטוס.

Variants:
- success
- warning
- danger
- info
- neutral

---

## Timeline

ציר זמן.

Props:
- events

---

## Avatar

הצגת משתמש או שותף.

Props:
- name
- imageUrl
- fallbackInitials

---

# Form Components

## FormField

מעטפת לשדה טופס.

Props:
- label
- children
- error

---

## TextInput

Props:
- value
- onChange
- placeholder
- disabled

---

## NumberInput

Props:
- value
- onChange
- min
- max

---

## SelectInput

Props:
- options
- value
- onChange

---

## DatePicker

Props:
- value
- onChange

---

## TimePicker

Props:
- value
- onChange

---

## TextArea

Props:
- value
- onChange
- rows

---

## FileUpload

Props:
- onUpload
- maxFiles
- accept

---

# Feedback Components

## LoadingSpinner

מציג מצב טעינה.

---

## EmptyState

Props:
- title
- description
- action

---

## ErrorState

Props:
- title
- message
- retryAction

---

## Toast

Variants:
- success
- error
- warning
- info

---

# Dialog Components

## Modal

Props:
- title
- content
- actions

---

## ConfirmDialog

Props:
- title
- message
- confirmLabel
- cancelLabel
- onConfirm

---

## Drawer

Props:
- open
- onClose
- children

---

# Domain Components

---

# Booking Components

## BookingCalendar

Modes:
- month
- week
- day

---

## BookingCard

כולל:
- title
- type
- time
- owner
- status

---

## BookingParticipants

רשימת משתתפים עם avatars.

---

# Finance Components

## InvoiceCard

כולל:
- amount
- status
- due date

---

## PaymentHistory

כולל:
- date
- amount
- method

---

## ChargeCard

כולל:
- title
- amount
- status
- due date

---

# Maintenance Components

## TicketCard

כולל:
- title
- category
- priority badge
- status

---

## MaintenanceTimeline

ציר זמן עדכוני תחזוקה.

---

## PriorityBadge

Variants:
- low
- medium
- high
- critical

---

# Credits Components

## CreditBalanceCard

כולל:
- weekday credits
- weekend credits

---

## CreditTransactionTable

Columns:
- date
- type
- amount
- description

---

# Announcement Components

## AnnouncementCard

כולל:
- title
- message
- priority badge
- createdAt

---

# Checklist Components

## ChecklistItem

כולל:
- checkbox
- label
- description

---

## ChecklistGroup

קבוצת פריטי checklist.

---

# Contacts Components

## ContactCard

כולל:
- name
- phone (קישור חיוג)
- email
- role

---

# Feedback Components

## FeedbackCard

כולל:
- category
- status
- createdAt
- description

---

# Partners / Members Components

## MemberCard

כולל:
- avatar
- fullName
- role badge
- status badge
- financial status
- פעולות: עריכה, הקפאה, הסרה (admin)

---

## InvitationCard

כולל:
- email
- role
- status
- expiresAt
- פעולות: ביטול הזמנה

---

# Component Guidelines

1. כל קומפוננט צריך להיות קטן ופשוט.
2. אין לשלב לוגיקה עסקית בתוך קומפוננט.
3. קומפוננטים כלליים נמצאים תחת `components/ui`.
4. קומפוננטים דומייניים נמצאים תחת feature.
5. כל קומפוננט חייב להיות typed.
6. יש לתמוך ב-RTL מלא.
7. יש לתמוך ב-dark mode.

---

# Styling Strategy

- utility-first Tailwind
- spacing אחיד
- צבעים לפי theme

---

# Accessibility

- aria labels
- keyboard navigation
- focus states
- contrast תקין

---

# Naming Conventions

כל קומפוננט יקרא ב-PascalCase: `BookingCard`, `CreditBalanceCard`, `BoatSwitcher`.
