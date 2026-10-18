import { Link, NavLink } from 'react-router-dom';
import '@/styles/brand.css';

/** The home page's navigation, shared with the catalog. */
export default function BrandHeader() {
  return (
    <>
      <a className="brand-skip" href="#main">דילוג לתוכן</a>
      <header className="brand-header">
        <div className="brand-wrap brand-bar">
          <Link className="brand-logo" to="/">Royal Icing</Link>
          <nav className="brand-nav" aria-label="ראשי">
            <NavLink to="/catalog">עוגיות</NavLink>
            <NavLink to="/courses">קורסים</NavLink>
            <NavLink to="/videos">סרטונים</NavLink>
          </nav>
          <Link className="brand-order" to="/catalog">הזמנה</Link>
        </div>
      </header>
    </>
  );
}
