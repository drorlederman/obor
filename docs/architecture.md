# Architecture

מסמך זה מגדיר את הארכיטקטורה הטכנית של אפליקציית OBOR.

המטרה היא לספק מבנה קוד ברור, מודולרי וסקיילבילי, המאפשר פיתוח יעיל בעזרת Claude Code ושמירה על תחזוקה קלה לאורך זמן.

האפליקציה בנויה בגישת **Feature-Based Architecture**, תוך הפרדה ברורה בין:
- UI
- לוגיקה עסקית
- גישה ל-Firebase
- מודלי נתונים
- ולידציה

---

# Product Model — Multi-Tenant SaaS

OBOR היא אפליקציית **SaaS multi-tenant** הזמינה ב-App Store ו-Play Store.

כל **סירה** היא tenant נפרד.

- משתמש מוריד את האפליקציה
- יוצר workspace חדש לסירה שלו — ומקבל אוטומטית תפקיד `admin`
- מזמין שותפים דרך קישור / email
- שותפים מצטרפים דרך קישור ההזמנה
- כל שותף רואה ופועל **רק** בתוך הסירה שלו

**בידוד נתונים:** כל document ב-Firestore נושא `boatId`. Security Rules מגבילות גישה לפי חברות בסירה בלבד.

**משתמש רב-סירות:** משתמש יכול להיות חבר ביותר מסירה אחת עם תפקידים שונים. context הסירה הפעיל נבחר על ידי המשתמש.

---

# Tech Stack

## Frontend / Mobile

| טכנולוגיה | תפקיד |
|-----------|-------|
| React | UI framework |
| TypeScript | שפת פיתוח |
| Vite | build tool |
| Tailwind CSS | עיצוב |
| Capacitor | עטיפה נייטיב — App Store / Play Store |

## State & Forms

| טכנולוגיה | תפקיד |
|-----------|-------|
| TanStack Query (React Query) | server state management |
| React Hook Form | טפסים |
| Zod | ולידציה |

## Backend

| טכנולוגיה | תפקיד |
|-----------|-------|
| Firebase Authentication | אימות משתמשים |
| Cloud Firestore | מסד נתונים ראשי |
| Firebase Storage | אחסון קבצים |
| Cloud Functions | לוגיקה עסקית קריטית |
| Firebase Hosting | אחסון web build |

---

# High Level Architecture

המערכת מחולקת לארבע שכבות:

## Mobile Layer (Capacitor)
- עוטף את ה-React web app לאפליקציה נייטיב
- מספק גישה ל-native plugins: push notifications, deep links, camera, file system
- מאפשר פרסום ב-App Store ו-Play Store
- קוד base אחד לשלושת הפלטפורמות: iOS, Android, Web

## Client Layer
האפליקציה עצמה (React + Vite).

## Service Layer
גישה ל-Firebase. מופרד לחלוטין מה-UI. כל פונקציה מקבלת `boatId` כפרמטר חובה.

## Backend Layer
Cloud Functions ולוגיקה עסקית קריטית. Admin SDK עוקף Security Rules.

---

# Folder Structure

```
obor/
├── frontend/
│   ├── src/
│   │   ├── app/                # App entry, providers, router
│   │   ├── features/           # Feature modules
│   │   │   ├── auth/
│   │   │   ├── onboarding/     # יצירת סירה, הצטרפות
│   │   │   ├── dashboard/
│   │   │   ├── bookings/
│   │   │   ├── credits/
│   │   │   ├── finance/
│   │   │   ├── maintenance/
│   │   │   ├── announcements/
│   │   │   ├── checklists/
│   │   │   ├── contacts/
│   │   │   ├── feedback/
│   │   │   ├── partners/
│   │   │   ├── settings/
│   │   │   ├── audit/
│   │   │   └── backups/
│   │   ├── components/
│   │   │   ├── ui/             # Design system components
│   │   │   └── layout/         # Layout components
│   │   ├── hooks/              # Shared hooks
│   │   ├── services/           # Firebase service layer
│   │   ├── lib/                # Firebase init, utils
│   │   ├── types/              # TypeScript types
│   │   ├── schemas/            # Zod schemas
│   │   └── context/            # React contexts (auth, boat)
│   ├── capacitor.config.ts
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── functions/
│   └── src/
│       ├── boats/
│       ├── bookings/
│       ├── credits/
│       ├── finance/
│       ├── maintenance/
│       ├── backup/
│       ├── scheduled/
│       ├── audit/
│       └── shared/
├── firebase/
│   ├── firestore.rules
│   ├── storage.rules
│   ├── firestore.indexes.json
│   └── firebase.json
├── scripts/
│   └── seed/
└── docs/
```

---

# Feature Module Structure

כל feature מכיל:

```
features/bookings/
├── components/     # UI components ספציפיים ל-feature
├── hooks/          # React Query hooks
├── services/       # Firebase queries (תמיד עם boatId)
├── schemas/        # Zod schemas
├── types/          # TypeScript types
└── pages/          # Page components (route level)
```

---

# Multi-Tenancy Implementation

## Boat Context

כל גישה לנתונים מתבצעת עם `boatId` פעיל מה-`BoatContext`:

```typescript
interface BoatContextValue {
  activeBoatId: string;
  activeBoat: Boat;
  activeRole: MemberRole;
  memberships: BoatMembership[];
  switchBoat: (boatId: string) => void;
}
```

## Data Access Pattern

כל service מקבל `boatId` כפרמטר חובה:

```typescript
// services/bookings.service.ts
export function getBookings(boatId: string, dateRange: DateRange) {
  return query(
    collection(db, 'bookings'),
    where('boatId', '==', boatId),
    where('startTime', '>=', dateRange.start),
    orderBy('startTime', 'asc')
  );
}
```

---

# Architecture Rules

- יש להפריד בין: pages, components, hooks, services, schemas, types, lib
- אין לכתוב לוגיקה עסקית מורכבת בתוך component UI
- יש להפריד בין שכבת UI לשכבת data access
- יש להפריד בין client actions לבין server-enforced actions
- יש להשתמש ב-TypeScript באופן מלא
- יש להעדיף קוד מודולרי, קריא וניתן לתחזוקה על פני קיצורי דרך
- אין ליצור קובץ יחיד עצום שמכיל פיצ'ר שלם
- **כל query חייב לכלול `boatId`** — אין שליפת נתונים ללא סינון לפי סירה

# Firebase Rules

- Firestore הוא מקור האמת הראשי
- פעולות קריטיות יתבצעו דרך Cloud Functions ולא ישירות מה-client
- Firebase Security Rules חייבים לשקף הרשאות לפי role ו-boatId
- יש לכתוב Audit Log לכל פעולה קריטית
- כל validation רגיש חייב להתבצע גם בשרת
