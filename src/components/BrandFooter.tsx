import { Link, useLocation } from 'react-router-dom';
import '@/styles/brand.css';

/** Shared home/footer content, including the existing management routes. */
export default function BrandFooter({ compact = false }: { compact?: boolean }) {
  const { pathname } = useLocation();
  return (
    <footer className={'brand-footer' + (compact ? ' brand-footer-compact' : '')}>
      <div className="brand-wrap">
        <div className="brand-foot">
          <div>
            <Link className="brand-logo" to="/">Royal Icing</Link>
            <p className="brand-description">
              עוגיות רויאל אייסינג בעבודת יד, עיצובים אישיים וקורסים למי שרוצה ליצור בעצמה.
            </p>
          </div>
          <div>
            <p className="brand-footer-heading">באתר</p>
            <ul>
              <li><Link to="/catalog">עוגיות</Link></li>
              <li><Link to="/courses">קורסים</Link></li>
              <li><Link to="/videos">סרטונים</Link></li>
              <li>{pathname === '/' ? <a href="#custom">עיצוב אישי</a> : <Link to="/contact">עיצוב אישי</Link>}</li>
            </ul>
          </div>
          <div>
            <p className="brand-footer-heading">יצירת קשר</p>
            <ul><li><Link to="/contact">פרטי קשר</Link></li></ul>
          </div>
        </div>
        <div className="brand-copyright">
          <Link to="/admin/leads">ניהול הזמנות</Link>{' · '}
          <Link to="/admin/products">ניהול מוצרים</Link><br />
          כל הזכויות שמורות
        </div>
      </div>
    </footer>
  );
}
