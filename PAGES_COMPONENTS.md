# 📚 מדריך עמודים וקומפוננטות

## דף זה מסביר כל עמוד וקומפוננטה בפרויקט

---

## 📄 עמודים (Pages)

### 🏠 HomePage
**קובץ**: `src/pages/HomePage.tsx`

**מטרה**: עמוד בית - כניסה ראשית לאתר

**מה זה עושה**:
- מציג Hero section (כותרת + תיאור)
- מציג 3 feature cards (יחודיות, התאמה, איכות)
- כפתור "צפו בקטלוג" שמניתב ל-/catalog

**נתונים**: כל הטקסט הוא סטטי (hardcoded)

**בעתיד**: אולי להוסיף testimonials או stats

---

### 📦 CatalogPage
**קובץ**: `src/pages/CatalogPage.tsx`

**מטרה**: רשימת כל המוצרים בקטלוג

**זרימת נתונים**:
1. Hook `useProducts()` מביא את המוצרים
2. מוצגים בGrid (3 עמודות)
3. כל כרטיס מוצג: שם, תיאור, תמונה
4. כפתור "צפה בפרטים" → ניתוב ל-/catalog/:id

**מצבים**:
- `isLoading === true` → "טוען מוצרים..."
- `products.length === 0` → "אין מוצרים עדיין"

**בעתיד**: להוסיף search, filter, sort

---

### 🔍 ProductDetailPage
**קובץ**: `src/pages/ProductDetailPage.tsx`

**מטרה**: הצגת פרטים מלאים של מוצר בודד

**זרימת נתונים**:
1. URL params `:id` מגיע מ-useParams()
2. Hook `useProducts()` מביא את כל המוצרים
3. חיפוש בArray → find(p.id === id)
4. אם לא נמצא → הודעת שגיאה
5. אם נמצא → הצגת כל הפרטים

**עיצוב**: 2 עמודות
- שמאל: תמונה (clickable ל-Lightbox)
- ימין: שם, מחיר, תיאור, קטגוריה, כפתור הזמנה

**אינטראקציות**:
- לחיצה על תמונה → ImageLightbox פתוח (הגדלה)
- כפתור חזרה → ניתוב ל-/catalog
- כפתור הזמנה → כרגע לא פעיל (TODO)

---

### 📧 ContactPage
**קובץ**: `src/pages/ContactPage.tsx`

**מטרה**: טופס ליצירת קשר עם הלקוח

**מבנה**:
- צד שמאל: מידע ליצירת קשר (טלפון, מייל, שעות)
- צד ימין: טופס

**שדות בטופס**:
- שם מלא (required)
- אימייל (required, email validation)
- טלפון (required, phone validation)
- הודעה (required, textarea)

**זרימה**:
1. User מילא את הטופס
2. לחץ "שלח הודעה"
3. handleSubmit() מזודה
4. **⚠️ כרגע**: רק preventDefault (לא משדרים)
5. **✅ בעתיד**: יוצרים Lead בFirebase → מופיע בAdminLeadsPage

---

### 👥 AdminLeadsPage
**קובץ**: `src/pages/admin/AdminLeadsPage.tsx`

**מטרה**: ניהול הפניות/הזמנות של לקוחות

**מבנה**:
- טבלה עם colummns: שם, אימייל, טלפון, הודעה, סטטוס, תאריך, פעולות

**זרימה**:
1. **כרגע**: hardcoded test data ב-state
2. **בעתיד**: React Query hook `useGetLeads()` מ-Firebase
3. User לוחץ "פרטים" בשורה
4. LeadModal נפתח עם הפנייה המלאה
5. User משנה סטטוס (new → contacted → completed)
6. State מתעדכן בטבלה
7. **בעתיד**: Firebase mutation לשמירה

**סטטוסים**:
- 🔵 new: פנייה חדשה
- 🟡 contacted: כבר יצרנו קשר
- 🟢 completed: סגור/בוצע

---

### 🎨 AdminProductsPage
**קובץ**: `src/pages/admin/AdminProductsPage.tsx`

**מטרה**: ניהול קטלוג המוצרים (CRUD - יצירה, קריאה, עדכון, מחיקה)

**מבנה**:
- כפתור "+ הוסף מוצר חדש" בראש
- Grid של כרטיסי מוצרים

**כל כרטיס מוצג**:
- תמונה
- קטגוריה
- שם ותיאור
- מחיר
- כפתורים: עריכה, מחיקה

**פעולות**:

**הוספה**:
1. לוחץ "+ הוסף מוצר חדש"
2. ProductModal נפתח (ריק)
3. User מילא שדות (שם, תיאור, מחיר, קטגוריה, תמונה)
4. לוחץ "שמור"
5. `addProduct()` → storage → state מתעדכן

**עריכה**:
1. לוחץ "עריכה" בכרטיס
2. ProductModal נפתח עם הנתונים הקיימים
3. User משנה
4. לוחץ "שמור"
5. `updateProduct()` → storage → state מתעדכן

**מחיקה**:
1. לוחץ "מחיקה"
2. Confirmation alert
3. אם אישור → `deleteProduct()` → storage → state מתעדכן

---

## 🧩 קומפוננטות (Components)

### 🧭 Navbar
**קובץ**: `src/components/Navbar.tsx`

**מטרה**: ניווט ראשי בכל עמוד

**לינקים**:
- בית (/)
- קטלוג (/catalog)
- צור קשר (/contact)
- ניהול הזמנות (/admin/leads) [admin]
- ניהול מוצרים (/admin/products) [admin]

**תכונות**:
- `useLocation()` hook בודק את הדף הנוכחי
- הלינק הפעיל מקבל class `.active` (עיצוב שונה)
- responsive (mobile-friendly)

---

### 📋 LeadModal
**קובץ**: `src/components/LeadModal.tsx`

**מטרה**: Modal להצגת פרטי פנייה

**בה מקבלת props**:
- `lead`: object של Lead
- `isOpen`: bool
- `onClose`: callback
- `onStatusChange`: callback

**מציגה**:
- שם, אימייל, טלפון, הודעה
- תאריך הפנייה
- סטטוס נוכחי עם 3 כפתורים (new, contacted, completed)

---

### 🎨 ProductModal
**קובץ**: `src/components/ProductModal.tsx`

**מטרה**: Modal לעריכה/הוספה של מוצר

**בה מקבלת props**:
- `isOpen`: bool
- `onClose`: callback
- `onSave`: callback (מקבל את נתוני המוצר)
- `initialProduct`: Product אם בעריכה, undefined אם הוספה

**שדות בטופס**:
- שם מוצר
- תיאור
- מחיר
- קטגוריה
- תמונה (ImageUpload component)

**ולידציה**:
- שם: required
- מחיר: required, number
- תמונה: required

---

### 📤 ImageUpload
**קובץ**: `src/components/ImageUpload.tsx`

**מטרה**: העלאת תמונה (מקובץ או URL)

**דרכים**:
- URL mode: הכנס קישור ישירות
- File mode: בחר קובץ מהמחשב

**תכונות**:
- Preview מידי כשבוחרים תמונה
- callback `onImageSelect()` עם הנתונים
- כרגע: שומרים כURL או base64
- בעתיד: העלאה ל-Firebase Storage

---

### 🔍 ImageLightbox
**קובץ**: `src/components/ImageLightbox.tsx`

**מטרה**: הגדלת תמונה בpopup

**בה מקבלת props**:
- `isOpen`: bool
- `imageSrc`: URL של התמונה
- `imageAlt`: טקסט תיאור
- `onClose`: callback לסגירה

**תכונות**:
- overlay אפור/שחור
- תמונה גדולה במרכז
- כפתור X לסגירה
- לחיצה בחוץ = סגירה

---

## 🎣 Hooks

### useProducts()
**קובץ**: `src/hooks/useProducts.ts`

**מטרה**: ניהול רשימת המוצרים

**מחזיר**:
```javascript
{
  products: Product[],
  isLoading: boolean,
  addProduct: (product) => void,
  updateProduct: (id, product) => void,
  deleteProduct: (id) => void
}
```

**נתונים**: קורא מ-localStorage, כרגע

---

### useApi()
**קובץ**: `src/hooks/index.ts`

**מטרה**: גישה לReact Query client

**מחזיר**:
```javascript
{
  queryClient: QueryClient,
  invalidateQueries: (key) => void,
  prefetchQuery: (key) => void
}
```

---

### useDocumentTitle()
**קובץ**: `src/hooks/index.ts`

**מטרה**: עדכון הכותרת של דף HTML

**שימוש**: `useDocumentTitle('בית - Royal Icing Catalog')`

---

### useAsync<T>()
**קובץ**: `src/hooks/index.ts`

**מטרה**: ניהול async operations

**מחזיר**:
```javascript
{
  status: 'idle' | 'pending' | 'success' | 'error',
  data: T,
  error: Error
}
```

---

## 🛠️ Utils

### storage.ts
**קובץ**: `src/utils/storage.ts`

**פונקציות**:
- `getProducts()` - קרא מ-localStorage
- `saveProducts()` - כתוב ל-localStorage
- `addProduct()` - הוסף מוצר
- `updateProduct()` - עדכן מוצר
- `deleteProduct()` - מחק מוצר
- `initializeWithDefaults()` - אתחול עם ברירות

---

### helpers.ts
**קובץ**: `src/utils/helpers.ts`

**פונקציות** (עברית):
- `formatDate()` - הצגת תאריך בעברית
- `formatPrice()` - הצגת מחיר בשקל
- `isValidEmail()` - בדיקת אימייל
- `isValidPhone()` - בדיקת טלפון ישראלי
- `truncateText()` - קיצור טקסט

---

## 📊 Types

**קובץ**: `src/types/index.ts`

```typescript
interface Product {
  id: string
  name: string
  description: string
  price: number
  image?: string
  category?: string
  createdAt?: Date
}

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  message: string
  productId?: string
  status: 'new' | 'contacted' | 'completed'
  createdAt: Date
}
```

---

## 📋 Quick Navigation

**כשרוצה לשנות עמוד מסוים**:
```
HomePage         → src/pages/HomePage.tsx
CatalogPage      → src/pages/CatalogPage.tsx
ProductDetailPage → src/pages/ProductDetailPage.tsx
ContactPage      → src/pages/ContactPage.tsx
AdminLeadsPage   → src/pages/admin/AdminLeadsPage.tsx
AdminProductsPage → src/pages/admin/AdminProductsPage.tsx
```

**כשרוצה לשנות קומפוננטה**:
```
Navbar           → src/components/Navbar.tsx
LeadModal        → src/components/LeadModal.tsx
ProductModal     → src/components/ProductModal.tsx
ImageUpload      → src/components/ImageUpload.tsx
ImageLightbox    → src/components/ImageLightbox.tsx
```

**כשרוצה לשנות hook**:
```
useProducts      → src/hooks/useProducts.ts
useApi           → src/hooks/index.ts
useDocumentTitle → src/hooks/index.ts
useAsync         → src/hooks/index.ts
```

---

**עדכון אחרון**: 17 במאי 2026
