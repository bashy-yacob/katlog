# שלב 1 — תשתית Firebase ואבטחת ניהול

## תוצאה

הושלמה התשתית המקומית: מסך התחברות מנהלת, הגנת ענף הניהול, טיפול באובדן הרשאה/פקיעת התחברות/שגיאות, התנתקות, כללי Firestore ו־Storage ותצורת Emulators. רק claim חתום `admin: true` מאפשר ניהול. אין הרשמה ציבורית ואין כתיבה ציבורית של הזמנות או פניות.

לא נוצרו נתונים בענן, לא נפרסו כללים, לא הופעל חיוב ולא הועברו מוצרים. האתר הציבורי ממשיך להשתמש בנתונים המקומיים. שלב 2 לא התחיל.

## קבצים שנוספו

- `src/auth/AdminAuthProvider.tsx`, `src/auth/auth-context.ts`, `src/auth/errors.ts`, `src/auth/RequireAdmin.tsx`
- `src/pages/admin/AdminLoginPage.tsx`, `src/vite-env.d.ts`
- `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`
- `vitest.config.ts`
- `tests/ui/admin-auth.test.tsx`, `tests/ui/unconfigured.test.tsx`
- `tests/security/auth.test.mjs`, `tests/security/rules.test.mjs`
- `FIREBASE_SETUP.md`, `STAGE1_REPORT.md`

## קבצים שעודכנו

- `src/App.tsx`, `src/routes/index.tsx`, `src/layouts/BrandLayout.tsx`, `src/components/AdminNav.tsx`: ספק התחברות, ניתוב מוגן, כניסה והתנתקות.
- `src/config/firebase.ts`: אתחול מותנה, סגירת הניהול בהיעדר הגדרות וחיבור demo מקומי מפורש.
- `src/api/catalog/endpoints.ts`: בדיקת קיום חיבור לפני פעולה והפרדת type import; המסכים עדיין אינם משתמשים ב־API הזה.
- `src/hooks/index.ts`: הסרת import לא בשימוש ו־stub ריק של prefetch.
- `package.json`, `package-lock.json`: כלי בדיקות, פקודות, עדכוני אבטחה תואמים ו־override לתלות gRPC.
- `eslint.config.js`, `tsconfig.json`, `tsconfig.node.json`: כיסוי TS/TSX ובדיקת טיפוסים פעילה.
- `.env.local.example`, `.gitignore`: דגל Emulator והתעלמות מתוצרים מקומיים.

תוצרי Build נוצרו ב־`dist` המוחרג מ־Git. Java נייד וקובצי Emulator הורדו למטמון המקומי, ללא שינוי PATH קבוע.

## בדיקות בפועל

| בדיקה | תוצאה |
|---|---|
| `npm run typecheck` | עבר עבור קוד האפליקציה ותצורת Vite/Vitest |
| `npm run lint` | עבר ללא שגיאות; שתי אזהרות קיימות ב־`useAsync` נחשפו עם הרחבת הכיסוי |
| `npm test` | 11 בדיקות ממשק עברו |
| `npm run test:security` | 7 בדיקות אינטגרציה ואבטחה עברו ב־Auth/Firestore/Storage Emulators |
| `npm run build` | עבר; אזהרה על bundle ראשי גדול מ־500 kB |
| `npm audit --omit=dev` | אפס ממצאים בתלויות production |
| התקנת npm / audit כולל כלי פיתוח | נשארו 7 ממצאים: 3 high ו־4 moderate, בשרשרת תלויות כלי הפיתוח |
| `git diff --check` | עבר |

בדיקות הממשק משתמשות ב־DOM מדומה וב־Firebase mocks כדי לבדוק שגיאת רשת, token שפג, תוצאה אסינכרונית ישנה, שינוי הרשאה, כניסה ישירה לנתיב ניהול, יציאה וניקוי מטמון. בדיקות ה־Emulator מפעילות SDK אמיתי, התחברות אמיתית מקומית, הענקת claim בסביבה מבודדת וכללי גישה אמיתיים.

בבדיקה ראשונה התגלתה דריסת תמונה קיימת שהתאפשרה ב־Storage. נוסף תנאי מפורש שהקובץ אינו קיים ונבדקה חסימת הדריסה. ההרצה החוזרת עברה. בהרצה הראשונה Java לא היה ב־PATH; לאחר הורדת Java 21 נייד הבדיקות הורצו בהצלחה.

לא בוצעו בדיקות דפדפן חזותיות, בדיקת מכשיר נוסף או בדיקות מול production. אין כרגע פרטי פרויקט אמיתי או חשבון מנהלת, ולכן לא ניתן לאמת את שירותי הענן או את הפריסה הקיימת.

## המשך ומגבלות

- לחיבור אמיתי נדרשים מזהה פרויקט Firebase, הגדרות Web App וזהות חשבון המנהלת. אין לשלוח סיסמה או מפתח service account בצ׳אט.
- יש לבדוק אילו שירותים, נתונים וכללים כבר קיימים לפני פריסה. אינדקסים קיימים אינם מוחלפים אוטומטית בקובץ המקומי הריק.
- ממצאי כלי הפיתוח דורשים המשך מעקב; לא בוצע `npm audit fix --force` שמציע שינויים ראשיים.
- שינוי claim אינו מבטל מיד token קיים. הממשק מרענן אותו כשהחלון חוזר ולפחות מדי דקה כשהוא גלוי; הפרטים ב־`FIREBASE_SETUP.md`.
- אפשר להמשיך בפיתוח מקומי של שלב 2 לאחר אישור המשתמשת. אימות שיתוף מוצרים בין מכשירים בענן תלוי בחיבור ובהגדרות בפועל.

נעצר בסיום השלב בהתאם לבקשת המשתמשת. [הוראות הגדרה](FIREBASE_SETUP.md).
