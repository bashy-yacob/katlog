# 🏗️ ארכיטקטורה טכנית ותחזוקה

## קבצים חשובים ודרך הפעולה שלהם

---

## 📁 מבנה הקבצים בפשטות

```
src/
├── App.tsx              ← Point entry של האפליקציה (Providers)
├── main.tsx             ← Bootstrap (ReactDOM.render)
├── index.css            ← Global CSS
├── App.css              ← App-level CSS

├── routes/
│   └── index.tsx        ← Router configuration עם כל paths

├── layouts/
│   ├── RootLayout.tsx   ← Wrapper עם Navbar + Outlet + Footer
│   └── RootLayout.css

├── pages/               ← Full page components
│   ├── HomePage.tsx
│   ├── CatalogPage.tsx
│   ├── ProductDetailPage.tsx
│   ├── ContactPage.tsx
│   └── admin/
│       ├── AdminLeadsPage.tsx
│       └── AdminProductsPage.tsx

├── components/          ← Reusable components
│   ├── Navbar.tsx
│   ├── LeadModal.tsx
│   ├── ProductModal.tsx
│   ├── ImageUpload.tsx
│   ├── ImageLightbox.tsx
│   └── ... וכו'

├── hooks/               ← Custom React hooks
│   ├── index.ts         ← useApi, useDocumentTitle, useAsync
│   └── useProducts.ts   ← Product management hook

├── services/            ← Services (React Query, Firebase, etc)
│   ├── queryClient.ts   ← React Query configuration
│   └── index.ts

├── types/               ← TypeScript interfaces
│   └── index.ts         ← Product, Lead, ApiResponse

├── utils/               ← Helper functions
│   ├── storage.ts       ← localStorage management
│   ├── helpers.ts       ← formatDate, formatPrice, validation
│   ├── constants.ts     ← API_BASE_URL, query keys
│   └── index.ts         ← re-exports

├── api/                 ← API layer (will be created)
│   ├── catalog/         ← Product API
│   └── leads/           ← Leads API

└── features/            ← Feature modules (optional, future)
```

---

## 🔀 זרימת בקשה (Request Flow)

### דוגמה: User לוחץ "קטלוג"

```
Browser URL
   ↓
/catalog
   ↓
Router (routes/index.tsx)
   ↓
Matches: path: 'catalog', element: <CatalogPage />
   ↓
CatalogPage מוטען
   ↓
CatalogPage.tsx renders:
   1. useDocumentTitle('קטלוג - ...')
   2. const { products, isLoading } = useProducts()
   ↓
useProducts hook (src/hooks/useProducts.ts):
   1. useEffect runs on mount
   2. Calls storage.getProducts()
   ↓
storage.ts:
   1. localStorage.getItem('royal-icing-products')
   2. JSON.parse() the data
   3. Return array of Products
   ↓
Hook returns { products, isLoading }
   ↓
CatalogPage renders Grid:
   .map(product => <ProductCard key={product.id} ... />)
   ↓
User sees product grid
```

---

## 📡 זרימה מלאה - הוספת מוצר חדש

```
1. USER CLICKS "+ הוסף מוצר חדש" בAdminProductsPage

2. AdminProductsPage.tsx:
   const handleOpenModal = (product?: Product) => {
     setEditingProduct(product)      // undefined = הוספה
     setIsModalOpen(true)
   }

3. ProductModal renders with props:
   - initialProduct: undefined (because adding, not editing)
   - onSave: handleSaveProduct
   - onClose: handleCloseModal

4. ProductModal.tsx:
   useEffect(() => {
     if (initialProduct) {
       setFormData({...}) // בעריכה - populate existing
     } else {
       setFormData({ /* empty */ }) // בהוספה - empty form
     }
   }, [initialProduct, isOpen])

5. USER FILLS FORM:
   handleInputChange() updates formData state

6. USER CLICKS "שמור":
   handleSubmit(e) {
     e.preventDefault()
     onSave(formData) // calls handleSaveProduct from AdminProductsPage
   }

7. AdminProductsPage - handleSaveProduct():
   if (editingProduct) {
     updateProduct(editingProduct.id, productData)
   } else {
     addProduct(productData) // ← הוספה
   }

8. useProducts.addProduct():
   const newProduct = {
     ...product,
     id: Date.now().toString(),    // יצר ID
     createdAt: new Date()         // יצר timestamp
   }
   storage.addProduct(newProduct)   // שמור ב-localStorage
   setProducts(prev => [...prev, newProduct])  // update state

9. storage.addProduct():
   const products = storage.getProducts()
   products.push(newProduct)
   storage.saveProducts(products)  // localStorage.setItem()

10. State updates:
    setProducts() propagates → AdminProductsPage re-renders
    ↓
    Grid updates → Product card appears

11. handleCloseModal():
    setIsModalOpen(false)
    setEditingProduct(undefined)
    ↓
    ProductModal unmounts
```

---

## 🔄 זרימה - עדכון סטטוס Lead

```
AdminLeadsPage.tsx:

1. User לוחץ "פרטים" בשורה
   handleViewLead(lead) {
     setSelectedLead(lead)
     setIsModalOpen(true)
   }

2. LeadModal renders עם הלead

3. User לוחץ כפתור סטטוס (e.g. "contacted"):
   onClick={() => onStatusChange(lead.id, 'contacted')}

4. AdminLeadsPage - handleStatusChange():
   setLeads(prevLeads =>
     prevLeads.map(lead =>
       lead.id === leadId
         ? { ...lead, status: newStatus }
         : lead
     )
   )
   ↓
   Updates the displayed table immediately

5. בעתיד (Phase 1):
   • useMutation hook
   • Firebase update
   • Persist change
```

---

## 🎯 Key Design Patterns

### 1. Custom Hooks (ה-logic)
```typescript
// Hook encapsulates business logic
export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([])
  
  useEffect(() => {
    const stored = storage.getProducts()
    setProducts(stored)
  }, [])
  
  const addProduct = (product) => { ... }
  const updateProduct = (id, product) => { ... }
  const deleteProduct = (id) => { ... }
  
  return { products, isLoading, addProduct, updateProduct, deleteProduct }
}

// Component uses hook (separation of concerns)
export function AdminProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts()
  // ... rest of component
}
```

### 2. Props Drilling (passing callbacks)
```typescript
// Parent passes callback
<ProductModal
  onSave={(productData) => {
    addProduct(productData)
  }}
/>

// Child calls callback
const handleSubmit = (e) => {
  onSave(formData) // calls addProduct
}
```

### 3. Local State for UI (isModalOpen)
```typescript
const [isModalOpen, setIsModalOpen] = useState(false)
// Not persisted to storage/API
// Just for showing/hiding Modal
```

### 4. Server State (products)
```typescript
const { products } = useProducts()
// Comes from storage/API
// Persisted
// Synchronized across components
```

---

## ⚙️ React Query Architecture (עתיד)

```
// Phase 1 - בעתיד יהיה ככה:

// 1. Define query keys (in src/utils/constants.ts)
export const queryKeys = {
  products: ['products'],
  product: (id) => ['products', id],
  leads: ['leads']
}

// 2. Create query hooks (in src/api/catalog/endpoints.ts)
export const useGetProducts = () => {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: async () => {
      const response = await fetch('/api/products')
      return response.json()
    }
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (product) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(product)
      })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products })
    }
  })
}

// 3. Use in components
export function AdminProductsPage() {
  const { data: products } = useGetProducts()
  const { mutate: addProduct } = useCreateProduct()
  
  // Same API but now with React Query benefits:
  // - Automatic caching
  // - Automatic refetch
  // - Retry on error
  // - Loading states
}
```

---

## 🧪 Error Handling (כרגע וטודו)

### כרגע:
```typescript
// No error handling
const handleSubmit = (e) => {
  e.preventDefault()
  // يتم בלי try/catch
}

// No loading states
const { products } = useProducts()
// If error in useProducts, component breaks
```

### בעתיד (Phase 5):
```typescript
// Error Boundary component
<ErrorBoundary>
  <CatalogPage />
</ErrorBoundary>

// Try/catch in async functions
const handleSubmit = async (e) => {
  try {
    setIsLoading(true)
    await submitForm(data)
    setSuccess(true)
  } catch (error) {
    setError(error.message)
  } finally {
    setIsLoading(false)
  }
}

// Error messages in UI
{error && <ErrorMessage message={error} />}
```

---

## 🔐 Type Safety

### TypeScript makes us safe:
```typescript
// ✅ CORRECT
const product: Product = {
  id: '1',
  name: 'Cookie',
  description: 'Delicious',
  price: 50
}

// ❌ ERROR (TypeScript catches)
const product: Product = {
  id: '1',
  name: 'Cookie',
  // Missing: description, price
}

// ✅ Hook returns typed object
const { products, isLoading, addProduct } = useProducts()
// TypeScript knows:
// - products is Product[]
// - isLoading is boolean
// - addProduct is (product) => void
```

---

## 📊 State Management Strategy

### Current (localStorage):
```
Component State → Hook State → localStorage

Pros: Simple, persistence
Cons: No real-time sync, single device only
```

### Future (React Query + Firebase):
```
Component State → React Query Cache → Firebase
                                  ↕
                         Real-time listeners
                         
Pros: Persistent, real-time sync, multi-device, server-driven
Cons: More complex, needs backend
```

---

## 🚀 Performance Optimization

### Current:
- CSS is minified during build
- React dev tools can be used
- Images are client-side only

### Future (Phase 6):
- Code splitting with React.lazy()
- Image optimization (compression, lazy loading)
- Memoization (useMemo, useCallback) where needed
- Virtual scrolling for large lists
- Service Worker for offline
- CDN for assets

---

## 🐛 Debugging Tips

### Browser DevTools:
```
1. React Tab:
   - Inspect components
   - See props and state
   - Trigger state changes
   
2. Console:
   - Check errors
   - Manual storage inspection:
     localStorage.getItem('royal-icing-products')

3. Network Tab:
   - Watch API calls (future)
   - Check headers
```

### VS Code:
```
1. TypeScript errors (red squiggles)
2. ESLint warnings
3. Breakpoints in debugger
```

### Common Issues:
```
// Issue: Component not re-rendering
// Solution: Check if state is being updated correctly
console.log('State:', products)

// Issue: Infinite loop
// Solution: Check useEffect dependencies
useEffect(() => { ... }, []) // Empty = run once

// Issue: Props not updating in child
// Solution: Verify parent is passing correct props
<Child key={parentState} {...props} />
```

---

## 📝 Coding Style

### Naming Conventions:
```
// Components: PascalCase
export default function HomePage() { }

// Functions: camelCase
const handleClick = () => { }
const formatDate = (date) => { }

// Constants: UPPER_SNAKE_CASE
const PRODUCTS_STORAGE_KEY = 'royal-icing-products'
const DEFAULT_PAGE_SIZE = 10

// File names:
// - Components: Component.tsx
// - Pages: HomePage.tsx
// - Hooks: useProducts.ts
// - Utils: helpers.ts
```

### Imports (use path aliases):
```typescript
// ❌ BAD
import { Product } from '../../../types'

// ✅ GOOD
import { Product } from '@/types'
```

---

## 🎓 Learning Path

**אם את/ה חדש/ה בקוד**:
1. קרא את DATA_FLOW.md
2. קרא את PAGES_COMPONENTS.md
3. קרא את קובץ Docstrings בקוד (שהוספנו)
4. Try changing a simple text in HomePage.tsx
5. Look at the console to see re-renders

**אם רוצה להוסיף feature**:
1. Start with the Page component
2. Add needed hooks (or create new one)
3. Add UI components
4. Test with mock data
5. When ready, integrate with API

**אם רוצה לתקן bug**:
1. Identify where bug appears (which page)
2. Check the component file
3. Check related hooks
4. Look at the data flow (DATA_FLOW.md)
5. Add console.log to trace the issue

---

## 📚 Resources

- React Docs: https://react.dev
- React Router: https://reactrouter.com
- React Query (TanStack): https://tanstack.com/query
- TypeScript: https://www.typescriptlang.org
- Vite: https://vitejs.dev

---

**עדכון אחרון**: 17 במאי 2026
