import { Outlet, useLocation } from 'react-router-dom';
import BrandLayout from './BrandLayout';

/** Home owns its composition; every inner page uses the same brand shell. */
export default function RootLayout() {
  const { pathname } = useLocation();
  return pathname === '/' ? <Outlet /> : <BrandLayout />;
}
