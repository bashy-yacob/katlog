import { Link, NavLink } from 'react-router-dom';

export default function AdminNav() {
  return (
    <aside className="admin-rail">
      <p className="ui-eyebrow">הסטודיו שלך</p>
      <nav aria-label="ניווט ניהול" className="admin-nav">
        <NavLink to="/admin/products">ניהול מוצרים</NavLink>
        <NavLink to="/admin/leads">הזמנות ופניות</NavLink>
      </nav>
      <Link className="admin-public-link" to="/catalog">לצפייה בגלריה <span aria-hidden="true">←</span></Link>
    </aside>
  );
}
