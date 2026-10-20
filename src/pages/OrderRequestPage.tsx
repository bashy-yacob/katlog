import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Product } from '@/types';
import { useDocumentTitle } from '@/hooks';
import { useProduct } from '@/hooks/useProducts';
import { catalogError } from '@/api/catalog/validation';
import PageHeading from '@/components/PageHeading';
import PageState from '@/components/PageState';
import Button from '@/components/Button';
import OrderRequestForm from '@/components/OrderRequestForm';
import './OrderRequestPage.css';

export default function OrderRequestPage() {
  const { id } = useParams<{ id: string }>();
  const { product, error, isLoading, retry } = useProduct(id);
  const [loaded, setLoaded] = useState<{ id: string; product: Product } | null>(null);
  useEffect(() => {
    if (id && product && product.isActive !== false && !error && loaded?.id !== id) setLoaded({ id, product });
  }, [id, product, error, loaded]);
  const selected = loaded && loaded.id === id ? loaded.product : undefined;
  useDocumentTitle('בקשת הזמנה - Royal Icing');
  const denied = error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied';
  return <div className="order-request-page brand-wrap">
    <Link className="brand-text-link" to="/catalog">חזרה לקטלוג</Link>
    <PageHeading eyebrow="עבודת יד · בקשה אישית" title="מתחילות במשהו מתוק." description="ספרי לנו מה תרצי, ונבדוק יחד את הפרטים הקטנים." />
    {selected ? <>{error && <p className="ui-notice">לא ניתן לרענן כרגע את זמינות המוצר. הפרטים שמילאת נשמרו; הזמינות תיבדק שוב בשליחה.</p>}<OrderRequestForm key={selected.id} product={selected} /></>
      : isLoading ? <p role="status">טוענת את המוצר...</p> : error && !denied ? <div><p className="form-error" role="alert">{catalogError(error)}</p><Button onClick={() => void retry()}>ניסיון נוסף</Button></div>
      : !product || product.isActive === false || denied ? <PageState title="המוצר אינו זמין להזמנה" description="אפשר לחזור לקטלוג ולבחור עיצוב אחר." action={<Link className="brand-button primary" to="/catalog">לגלריית העוגיות</Link>} />
      : <p role="status">מכינה את טופס הבקשה...</p>}
  </div>;
}
