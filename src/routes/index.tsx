import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';
import HomePage from '@/pages/HomePage';
import CatalogPage from '@/pages/CatalogPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import ContactPage from '@/pages/ContactPage';
import AdminLeadsPage from '@/pages/admin/AdminLeadsPage';
import AdminProductsPage from '@/pages/admin/AdminProductsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <div className="error-page">404 - Page not found</div>,
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
      {
        path: 'contact',
        element: <ContactPage />,
      },
      {
        path: 'admin/leads',
        element: <AdminLeadsPage />,
      },
      {
        path: 'admin/products',
        element: <AdminProductsPage />,
      },
    ],
  },
]);

export default router;
