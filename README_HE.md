# Royal Icing Catalog

קטלוג דיגיטלי לעסק עוגיות רויאל אייסינג

## 📚 דוקומנטציה (חשוב לקריאה!)

**אם אתה חוזר לפרויקט אחרי הפסקה, קרא אלה בסדר:**

1. **[HOW_TO_RETURN.md](HOW_TO_RETURN.md)** - מדריך להחזרה (15 דק')
2. **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - סטטוס כללי של הפרויקט
3. **[DATA_FLOW.md](DATA_FLOW.md)** - דיאגרמות זרימת נתונים (עיקרי!)
4. **[PAGES_COMPONENTS.md](PAGES_COMPONENTS.md)** - כל עמוד וקומפוננטה
5. **[ARCHITECTURE_DETAILED.md](ARCHITECTURE_DETAILED.md)** - פרטים טכניים
6. **[NEXT_STEPS.md](NEXT_STEPS.md)** - מה צריך לעשות הבא

**הערות בקוד**: כל קובץ חשוב יש לו הערות בעברית בתחילה המסבירות:
- מה עושה הקובץ
- איך הנתונים זורמים דרכו
- מאיפה מגיעות קלט ולאן הם הולכים

## טכנולוגיות

- **React 19** עם TypeScript
- **Vite** - build tool מהיר
- **React Router v7** - ניתוב צד קליינט
- **React Query v5** - ניהול מצב שרתי
- **Lucide React** - ספריית אייקונים
- **Firebase** - backend (עדיין לא חובר)
- **React Hook Form** - form management

## התחלה מהירה

### התקנה

```bash
npm install
```

### פיתוח

```bash
npm run dev
```

הפרויקט יפתח ב-`http://localhost:5173`

### בנייה

```bash
npm run build
```

## ארכיטקטורה

```
src/
├── api/              # שכבת אינטגרציה API (יתווצר בPhase 1)
├── components/       # קומפוננטות UI מתכנסות
├── features/         # מודולי תכונות
├── hooks/            # React hooks מותאמים
├── layouts/          # קומפוננטות layout
├── pages/            # עמודים לנתיבים
├── routes/           # תצורת נתיבים
├── services/         # שירותים (React Query)
├── types/            # TypeScript types
└── utils/            # פונקציות עזר (storage, helpers)
```

## נתיבים

- `/` - עמוד בית
- `/catalog` - קטלוג מוצרים
- `/catalog/:id` - פרטי מוצר
- `/contact` - טופס יצירת קשר
- `/admin/leads` - ניהול הזמנות

## חוקים חשובים

1. **אין קריאות API ישירות** - כל בקשות API חייבות להשתמש ב-React Query
2. **TypeScript** - כל הקבצים בהרחבות `.ts` או `.tsx`
3. **import aliases** - השתמש בקידומת `@/` (מוגדר ב-`tsconfig.json`)
4. **מבנה מודולרי** - שמור על תכונות שמונעות ושמות בהן

## שלבים הבאים (Priority Order)

### Phase 1 - API Integration (High Priority)
1. [ ] יצור API endpoints ב-`src/api/catalog/`
   - `useGetProducts()` - fetch כל המוצרים
   - `useGetProductById(id)` - fetch מוצר אחד
2. [ ] יצור API endpoints ב-`src/api/leads/`
   - `useCreateLead()` - שלח טופס צור קשר
   - `useGetLeads()` - admin view של leads

### Phase 2 - Firebase Setup (High Priority)
1. [ ] הגדר Firebase config ב-`src/services/firebase.ts`
2. [ ] הגדר Firestore collections (products, leads)
3. [ ] חבר את Pages ל-API calls

### Phase 3 - Components Enhancement (Medium Priority)
1. [ ] בנה `ProductCard` component עם lucide icons
2. [ ] בנה `LoadingState` ו-`ErrorBoundary` components
3. [ ] שדרג את `ImageUpload` וטפסים עם error handling
4. [ ] הוסף responsive UI improvements

## ניסיון

ראה [ARCHITECTURE.md](./ARCHITECTURE.md) להוראות מפורטות.
