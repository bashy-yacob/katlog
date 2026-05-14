import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        Royal Icing <span style={{ fontWeight: '300', fontSize: '1.2rem' }}>Catalog</span>
      </Link>

      <ul className="nav-links">
        <li className="nav-item">
          <Link to="/" className={isActive('/') ? 'active' : ''}>
            בית
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/catalog" className={isActive('/catalog') ? 'active' : ''}>
            קטלוג
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/contact" className={isActive('/contact') ? 'active' : ''}>
            צור קשר
          </Link>
        </li>
        
        {/* קטגוריית ניהול עם עיצוב מעט שונה */}
        <li className="nav-item admin-link">
          <Link to="/admin/leads" className={isActive('/admin/leads') ? 'active' : ''}>
            ניהול הזמנות
          </Link>
        </li>
        <li className="nav-item admin-link">
          <Link to="/admin/products" className={isActive('/admin/products') ? 'active' : ''}>
            ניהול מוצרים
          </Link>
        </li>
      </ul>
    </nav>
  );
}