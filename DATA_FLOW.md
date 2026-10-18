# 🔄 זרימת נתונים בפרויקט - Data Flow Diagram

## סקירה כללית

הפרויקט עובד עם זרימת נתונים בפשטות:
- **Component** ← (זקוק לנתונים) ← **Hook** ← (קורא מ) ← **Storage/API**
- **Component** → (שומר נתונים) → **Hook** → (כותב ל) → **Storage/API**

---

## 1️⃣ זרימת קריאה (READ) - צפייה בנתונים

```
User לוחץ "/catalog"
         ↓
Browser Router ניתוב ל-/catalog
         ↓
CatalogPage מוטען
         ↓
CatalogPage קורא ל-useProducts() hook
         ↓
useProducts() קורא ל-storage.getProducts()
         ↓
storage קורא מ-localStorage 'royal-icing-products'
         ↓
מוחזר array של Products
         ↓
Products מוצגים בGRID בCatalogPage
         ↓
User לוחץ על מוצר → ניתוב ל-/catalog/:id
         ↓
ProductDetailPage מוטען
         ↓
ProductDetailPage קורא ל-useParams() → מקבל ID
         ↓
ProductDetailPage קורא ל-useProducts() → מקבל כל המוצרים
         ↓
חוקר את הarray → find(product.id === id)
         ↓
מוצר נמצא → מוצג בפרטים
```

---

## 2️⃣ זרימת כתיבה (CREATE/UPDATE) - שינוי נתונים

### הוספת מוצר חדש:

```
User בAdminProductsPage
         ↓
לוחץ "+ הוסף מוצר חדש"
         ↓
ProductModal נפתח (ריק)
         ↓
User מילא טופס (שם, תיאור, מחיר, תמונה)
         ↓
לוחץ "שמור"
         ↓
ProductModal קורא ל-onSave(productData)
         ↓
AdminProductsPage קורא ל-addProduct(productData)
         ↓
useProducts hook מתחדש:
  - יוצר ID וTimestamp חדשים
  - קורא ל-storage.addProduct()
  - storage שומר ב-localStorage
  - setProducts() מעדכן את state ב-hook
         ↓
AdminProductsPage רואה את החדש בGRID
```

### עריכת מוצר קיים:

```
User בAdminProductsPage
         ↓
לוחץ "עריכה" בכרטיס מוצר
         ↓
ProductModal נפתח עם הנתונים הקיימים
         ↓
User משנה נתונים
         ↓
לוחץ "שמור"
         ↓
ProductModal קורא ל-onSave(updatedData)
         ↓
AdminProductsPage קורא ל-updateProduct(id, updatedData)
         ↓
useProducts hook מתחדש:
  - חוקר את הArray
  - storage.updateProduct() משנה ב-localStorage
  - setProducts() מעדכן את state
         ↓
AdminProductsPage רואה את המוצר המעודכן
```

### מחיקת מוצר:

```
User בAdminProductsPage
         ↓
לוחץ "מחיקה"
         ↓
Confirmation dialog
         ↓
User מאשר → קורא ל-deleteProduct(id)
         ↓
useProducts hook מתחדש:
  - storage.deleteProduct() מוחק מ-localStorage
  - setProducts() מעדכן את state (filter)
         ↓
AdminProductsPage מתעדכן - מוצר חדל
```

---

## 3️⃣ זרימת טופס צור קשר (Contact Form)

```
User בContactPage
         ↓
מילא טופס (שם, אימייל, טלפון, הודעה)
         ↓
לוחץ "שלח הודעה"
         ↓
handleSubmit() מזודה
         ↓
⚠️ כרגע: רק preventDefault (לא שולח לשום מקום)
         ↓
✅ בעתיד (Phase 1):
   - קורא ל-useCreateLead() mutation
   - Mutation שומר ל-Firebase Firestore
   - Lead מופיע בAdminLeadsPage
```

---

## 4️⃣ זרימת ניהול הזמנות (Leads)

```
AdminLeadsPage טוען
         ↓
📌 כרגע: hardcoded test data ב-state
         ↓
✅ בעתיד (Phase 1):
   - useGetLeads() hook
   - React Query קורא מ-Firebase
   - Leads מוצגים בטבלה
         ↓
User לוחץ "פרטים"
         ↓
LeadModal נפתח עם הפנייה
         ↓
User משנה סטטוס (new → contacted → completed)
         ↓
onStatusChange(id, newStatus) קורא
         ↓
AdminLeadsPage מעדכן את state
         ↓
✅ בעתיד: 
   - useMutation ל-Firebase
   - Lead מתעדכן ב-database
```

---

## 5️⃣ Routing Map (ניתוב דפים)

```
בRootLayout:
┌─────────────────────────────────┐
│         Navbar (קבוע)             │
├─────────────────────────────────┤
│         <Outlet />  (משתנה)       │
│   ↑ כאן מופיעים עמודים שונים      │
├─────────────────────────────────┤
│         Footer (קבוע)             │
└─────────────────────────────────┘

Routes בRouter:
  / → HomePage (home)
  /catalog → CatalogPage (רשימה)
  /catalog/:id → ProductDetailPage (פרטים)
  /contact → ContactPage (טופס)
  /admin/leads → AdminLeadsPage (טבלה)
  /admin/products → AdminProductsPage (ניהול)
```

---

## 6️⃣ State Management

### Local Component State:
```
CatalogPage
  - products (מ-useProducts hook)
  - isLoading (מ-useProducts hook)

AdminProductsPage
  - isModalOpen
  - editingProduct

ProductDetailPage
  - isLightboxOpen
```

### Server State (בעתיד):
```
React Query (QueryClient)
  - caches API responses
  - auto-refetch לפי staleTime
  - automatic retry בעת כישלון
```

### localStorage (כרגע):
```
Key: 'royal-icing-products'
Value: JSON array של Products
Persistent: כן (נשמר בדפדפן)
```

---

## 7️⃣ Components Tree

```
App
├── QueryClientProvider
│   └── RouterProvider
│       └── RootLayout
│           ├── Navbar
│           ├── <Outlet />
│           │   ├── HomePage
│           │   ├── CatalogPage
│           │   │   └── Product Cards (map)
│           │   ├── ProductDetailPage
│           │   │   └── ImageLightbox
│           │   ├── ContactPage
│           │   ├── AdminLeadsPage
│           │   │   └── LeadModal
│           │   └── AdminProductsPage
│           │       └── ProductModal
│           │           └── ImageUpload
│           └── Footer
```

---

## 🔮 תכנית עתידית (Phase 1 - API Integration)

### Firebase Firestore Collections:
```
/products
  - id: string
  - name: string
  - description: string
  - price: number
  - image: string (URL)
  - category: string
  - createdAt: timestamp

/leads
  - id: string
  - name: string
  - email: string
  - phone: string
  - message: string
  - status: 'new' | 'contacted' | 'completed'
  - createdAt: timestamp
```

### API Hooks (יווצרו):
```
useGetProducts() → useQuery fetching from Firestore
useGetProduct(id) → useQuery for single product
useCreateLead() → useMutation creating lead
useGetLeads() → useQuery fetching leads
useUpdateLeadStatus() → useMutation updating status
useDeleteProduct() → useMutation deleting product
useUpdateProduct() → useMutation updating product
```

---

## 📊 Data Size Hierarchy

```
localStorage JSON
  ↓
products array []
  ├── Product 1
  │   ├── id
  │   ├── name
  │   ├── price
  │   ├── image (base64 או URL)
  │   └── ...
  ├── Product 2
  │ ...
```

---

## 🚨 Error Handling (לעשות)

```
API Errors:
  - Network error → retry automatically (React Query)
  - 404 error → show "Not Found" message
  - 500 error → show "Server Error" message

Form Validation:
  - Required fields → show red border
  - Email validation → regex check
  - Phone validation → Israeli format

Component Errors:
  - ErrorBoundary (to create)
  - Fallback UI
```

---

## 💡 TL;DR - קצר וקולע

1. **קריאה**: Component → useHook → storage/API → localStorage
2. **כתיבה**: Component → useHook → mutation → localStorage
3. **ניתוב**: Navbar links → React Router → <Outlet/> משתנה
4. **Modals**: Click trigger → isOpen state → Modal renders
5. **Validation**: Form data → validation → onSave callback

---

**עדכון אחרון**: 17 במאי 2026
