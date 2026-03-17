# CLAUDE.md

## Project
OBOR - One Boat One Responsibility

מערכת לניהול שותפים בסירת מפרש משותפת.
האפליקציה מרכזת יומן הזמנות, מטבעות, פיננסים, תחזוקה, הודעות, צ'קליסטים, אנשי קשר, גיבוי ופידבק.

## Mandatory Language Rules
- שפת הממשק היא עברית בלבד.
- כל ה-UI חייב להיות RTL מלא.
- כל טקסט שמוצג למשתמש חייב להיות בעברית:
  - כפתורים
  - Labels
  - Placeholders
  - הודעות שגיאה
  - Toasts
  - Dialogs
  - Empty states
  - Success states
  - Titles
  - Help text
- אין לערבב אנגלית בתוך טקסטים למשתמש.
- מזהים פנימיים, שמות משתנים, שמות קבצים, שמות collections ושמות fields יהיו באנגלית.
- יש להקפיד על תצוגה תקינה של תאריכים, שעות, מספרים ומבנה מסך ב-RTL.

## Product Intent
המטרה היא לנהל את כל היבטי הבעלות המשותפת על סירה:
- הזמנות
- יתרות מטבעות
- חיובים ותשלומים
- תחזוקה
- תקשורת בין שותפים
- מידע תפעולי חשוב

## Roles
- partner
- scheduler
- treasurer
- maintenanceManager
- admin

## High-Level Product Modules
- לוח בקרה
- יומן הזמנות
- מטבעות
- פיננסים
- תחזוקה
- הודעות
- צ'קליסטים
- אנשי קשר חשובים
- ניהול שותפים
- פידבק ודיווח תקלות
- הגדרות מערכת
- גיבוי ושחזור

## Tech Stack
- React
- TypeScript
- Vite
- Tailwind CSS
- React Query
- React Hook Form
- Zod
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Cloud Functions

## Architecture Rules
- יש להפריד בין:
  - pages
  - components
  - hooks
  - services
  - schemas
  - types
  - lib
- אין לכתוב לוגיקה עסקית מורכבת בתוך component UI.
- יש להפריד בין שכבת UI לשכבת data access.
- יש להפריד בין client actions לבין server-enforced actions.
- יש להשתמש ב-TypeScript באופן מלא.
- יש להעדיף קוד מודולרי, קריא וניתן לתחזוקה על פני קיצורי דרך.
- אין ליצור קובץ יחיד עצום שמכיל פיצ'ר שלם.

## Firebase Rules
- Firestore הוא מקור האמת הראשי.
- פעולות קריטיות יתבצעו דרך Cloud Functions ולא ישירות מה-client.
- Firebase Security Rules חייבים לשקף הרשאות לפי role ובעלות.
- יש לכתוב Audit Log לכל פעולה קריטית.
- כל validation רגיש חייב להתבצע גם בשרת.

## Critical Server-Side Actions
יש לממש דרך Cloud Functions לפחות את הפעולות הבאות:
- יצירת הזמנה
- ביטול הזמנה והחזר מטבעות
- יצירת חיוב קבוצתי
- יצירת חשבוניות לשותפים
- רישום תשלום
- הקפאת שותף
- שחזור מגיבוי
- רישום Audit Log
- תזכורות מתוזמנות
- לוגיקת תחזוקה קריטית

## UX Rules
- Mobile first
- Bottom tab bar במובייל
- Sidebar בדסקטופ
- Dark mode עם זיהוי אוטומטי לפי מערכת + החלפה ידנית
- Loading states, empty states, error states, success feedback
- Pull-to-refresh במסכים מתאימים במובייל
- אנימציות עדינות, לא מוגזמות
- טפסים ברורים ונגישים
- ניווט פשוט וברור לשותפים לא טכניים

## Delivery Workflow
Claude must work in phases.

For every phase:
1. להסביר מה עומד להיבנות
2. לפרט אילו קבצים נוצרים או משתנים
3. לממש בצורה מודולרית
4. לסכם מה הושלם
5. לציין מה נשאר

## Do Not
- אל תכתוב את כל האפליקציה בקובץ אחד
- אל תבצע פעולות קריטיות רק בצד לקוח
- אל תשתמש באנגלית בטקסטים של UI
- אל תמציא business rules ללא ציון הנחה
- אל תדלג על loading/error/empty states
- אל תבנה auth/permissions רק בצד frontend

## Preferred Delivery Order
1. Folder structure
2. Route map
3. Firestore schema
4. Permissions matrix
5. Security rules strategy
6. Cloud Functions plan
7. Scaffold
8. Auth
9. Calendar
10. Credits
11. Finance
12. Maintenance
13. Announcements / Checklists / Contacts / Feedback
14. Admin / Settings / Backup
15. Polish

---

# MANDATORY: Post-Task Documentation (SR-PTD)

**CRITICAL: After completing ANY task that modifies files, you MUST invoke this skill:**

```
Skill tool -> skill: "sr-ptd-skill"
```

**This is NOT optional. Skipping this skill means the task is INCOMPLETE.**

When planning ANY development task, add as the FINAL item in your task list:
```
[ ] Create SR-PTD documentation
```

### Before Starting Any Task:
1. Create your task plan as usual
2. Add SR-PTD documentation as the last task item
3. This step is MANDATORY for: features, bug fixes, refactors, maintenance, research

### When Completing the SR-PTD Task:
1. Read `~/.claude/skills/sr-ptd-skill/SKILL.md` for full instructions
2. Choose template: Full (complex tasks) or Quick (simple tasks)
3. Create file: `SR-PTD_YYYY-MM-DD_[task-id]_[description].md`
4. Save to: `C:/projects/Skills/Dev_doc_for_skills`
5. Fill all applicable sections thoroughly

### Task Completion Criteria:
A task is NOT complete until SR-PTD documentation exists.

### If Conversation Continues After Task:
Update the existing SR-PTD document instead of creating a new one.

---
