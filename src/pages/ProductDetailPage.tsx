import { Link, useParams } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks';
import { useProduct } from '@/hooks/useProducts';
import { catalogError } from '@/api/catalog/validation';
import ImageLightbox from '@/components/ImageLightbox';
import PageState from '@/components/PageState';
import Button from '@/components/Button';
import { formatPrice } from '@/utils/helpers';
import { productCategoryLabel } from '@/utils/presentation';
import { useState } from 'react';
import './ProductDetailPage.css';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { product, isLoading, error, retry } = useProduct(id);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  useDocumentTitle(product && product.isActive !== false && !error ? product.name + ' - Royal Icing Catalog' : 'פרטי מוצר - Royal Icing Catalog');

  if (isLoading) return <div className="system-page brand-wrap"><p role="status">טוענת את פרטי העוגיות...</p></div>;
  const denied = error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied';
  if (error && !denied) return <div className="system-page brand-wrap"><p className="form-error" role="alert">{catalogError(error)}</p><Button onClick={() => void retry()}>ניסיון נוסף</Button></div>;
  if (!product || product.isActive === false || denied) return (
    <div className="system-page brand-wrap">
      <PageState headingLevel={1} title="המוצר לא נמצא" description="העיצוב שחיפשת אינו זמין כרגע בקטלוג. אפשר לחזור לגלריה ולגלות את העיצובים הקיימים."
        action={<Link className="brand-button primary" to="/catalog">חזרה לקטלוג</Link>} />
    </div>
  );

  const hasImage = !!product.image && product.image !== failedImage;
  return (
    <div className="product-detail-page brand-wrap">
      <Link className="brand-text-link product-back" to="/catalog">חזרה לגלריה <span aria-hidden="true">←</span></Link>
      <div className="product-main-layout">
        <div className="product-photo-column">
          <button type="button" className="product-image-gallery" disabled={!hasImage}
            onClick={() => hasImage && setIsLightboxOpen(true)} aria-label={'הגדלת התמונה של ' + product.name}>
            {hasImage ? <img src={product.image} alt={product.name} decoding="async" onError={() => setFailedImage(product.image ?? null)} />
              : <span>תמונת המוצר אינה זמינה כרגע</span>}
          </button>
          {hasImage && <p className="form-note product-photo-note">לחצי על התמונה למבט מקרוב.</p>}
        </div>
        <div className="product-content-side">
          <p className="ui-eyebrow">רויאל אייסינג · עבודת יד</p>
          <h1 className="product-title-detail">{product.name}</h1>
          <p className="product-price-tag">החל מ־<bdi>{formatPrice(product.price)}</bdi></p>
          <p className="form-note">מחיר התחלתי בלבד. המחיר הסופי ייקבע לאחר בדיקת בקשת ההזמנה.</p>
          <p className="product-desc-text">{product.description}</p>
          {product.category && <dl className="product-extra-details"><dt>קטגוריה</dt><dd>{productCategoryLabel(product.category)}</dd></dl>}
          <div className="product-order-actions">
            <Link className="brand-button primary order-now-btn" to={'/catalog/' + encodeURIComponent(product.id) + '/order'} aria-describedby="order-availability">בקשת הזמנה</Link>
            <Link className="brand-text-link" to="/contact">לשאלות וליצירת קשר</Link>
          </div>
          <p className="form-note" id="order-availability">איסוף עצמי בלבד. שליחת בקשה אינה אישור סופי של ההזמנה.</p>
        </div>
      </div>
      <ImageLightbox isOpen={isLightboxOpen} imageSrc={product.image || ''} imageAlt={product.name} onClose={() => setIsLightboxOpen(false)} />
    </div>
  );
}
