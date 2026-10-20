import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from './auth-context';
import Button from '@/components/Button';

export default function RequireAdmin() {
  const { status, error, logout, refresh } = useAdminAuth();
  const location = useLocation();
  if (status === 'loading') return <p role="status">בודקת הרשאות ניהול...</p>;
  if (status === 'signed-out') return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  if (status === 'admin') return <Outlet />;
  return <section className="system-page brand-wrap">
    <h1>{status === 'forbidden' ? 'אין הרשאת ניהול לחשבון הזה' : 'הניהול אינו זמין כרגע'}</h1>
    <p role="alert">{status === 'unconfigured' ? 'חיבור Firebase טרם הוגדר. יש להשלים את הגדרות המערכת לפני הכניסה לניהול.' : error || 'רק מנהלת שהוגדרה כמורשית יכולה להיכנס.'}</p>
    {status !== 'unconfigured' && <><Button onClick={() => void refresh()}>בדיקה מחדש</Button><Button tone="quiet" onClick={() => void logout()}>יציאה מהחשבון</Button></>}
  </section>;
}
