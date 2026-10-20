import { Link, NavLink } from 'react-router-dom';
import { useAdminAuth } from '@/auth/auth-context';
import Button from './Button';

export default function AdminNav() {
  const { logout } = useAdminAuth();
  return (
    <aside className="admin-rail">
      <p className="ui-eyebrow">הסטודיו שלך</p>
      <nav aria-label="ניווט ניהול" className="admin-nav">
        <NavLink to="/admin/products">ניהול מוצרים</NavLink>
        <NavLink to="/admin/leads">הזמנות ופניות</NavLink>
      </nav>
      <Button tone="quiet" onClick={() => void logout()}>התנתקות</Button>
      <Link className="admin-public-link" to="/catalog">לצפייה בגלריה <span aria-hidden="true">←</span></Link>
    </aside>
  );
}
