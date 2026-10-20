/**
 * 🗺️ Router Configuration - הגדרת כל הניתובים באפליקציה
 * 
 * מטרה: הגדרת מבנה התוכנית של כל הדפים
 * 
 * Routing Tree:
 *   /
 *   ├── "/" → HomePage (בעמוד הבית)
 *   ├── "/catalog" → CatalogPage (רשימת מוצרים)
 *   ├── "/catalog/:id" → ProductDetailPage (פרטי מוצר בודד)
 *   ├── "/contact" → ContactPage (טופס צור קשר)
 *   ├── "/admin/leads" → AdminLeadsPage (טבלת הזמנות)
 *   └── "/admin/products" → AdminProductsPage (ניהול מוצרים)
 * 
 * Root Layout (RootLayout):
 *   - מעטפת את כל העמודים
 *   - מכילה Navbar (ניווט) ו-Footer
 *   - ה-<Outlet /> משתנה בין עמודים שונים
 * 
 * Error Handling:
 *   - errorElement: מוצג כשיש שגיאה (404 וכו')
 * 
 * זרימה:
 *   משתמש לוחץ בNavbar → ניתוב משתנה → <Outlet /> מחליף עמוד → תצוגה חדשה
 */
import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';
import HomePage from '@/pages/HomePage';
import CatalogPage from '@/pages/CatalogPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import ContactPage from '@/pages/ContactPage';
import ComingSoonPage from '@/pages/ComingSoonPage';
import AdminLeadsPage from '@/pages/admin/AdminLeadsPage';
import AdminProductsPage from '@/pages/admin/AdminProductsPage';
import NotFoundPage from '@/pages/NotFoundPage';
import RouteErrorPage from '@/pages/RouteErrorPage';
import RequireAdmin from '@/auth/RequireAdmin';
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import OrderRequestPage from '@/pages/OrderRequestPage';
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'catalog',
        element: <CatalogPage />,
      },
      {
        path: 'catalog/:id',
        element: <ProductDetailPage />,
      },
      { path: 'catalog/:id/order', element: <OrderRequestPage /> },
      {
        path: 'courses',
        element: <ComingSoonPage kind="courses" />,
      },
      {
        path: 'videos',
        element: <ComingSoonPage kind="videos" />,
      },
      {
        path: 'contact',
        element: <ContactPage />,
      },
      {
        path: 'admin/login',
        element: <AdminLoginPage />,
      },
      {
        path: 'admin',
        element: <RequireAdmin />,
        children: [
          { index: true, element: <AdminProductsPage /> },
          { path: 'leads', element: <AdminLeadsPage /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'products', element: <AdminProductsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

export default router;
