import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import BrandHeader from '@/components/BrandHeader';
import BrandFooter from '@/components/BrandFooter';
import AdminNav from '@/components/AdminNav';
import { useAdminAuth } from '@/auth/auth-context';

export default function BrandLayout() {
  const { pathname } = useLocation();
  const { status } = useAdminAuth();
  const isAdmin = pathname.startsWith('/admin') && status === 'admin';
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="brand-surface brand-layout">
      <BrandHeader />
      {isAdmin ? (
        <div className="admin-shell brand-wrap">
          <AdminNav />
          <main className="brand-main admin-main" id="main" tabIndex={-1}><Outlet /></main>
        </div>
      ) : <main className="brand-main" id="main" tabIndex={-1}><Outlet /></main>}
      <BrandFooter compact={isAdmin} />
    </div>
  );
}
