import { Link, useParams } from 'react-router-dom';
import { useDocumentTitle, useProducts } from '@/hooks';
import ImageLightbox from '@/components/ImageLightbox';
import PageState from '@/components/PageState';
import Button from '@/components/Button';
import { formatPrice } from '@/utils/helpers';
import { productCategoryLabel } from '@/utils/presentation';
import { useState } from 'react';
import './ProductDetailPage.css';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { products, isLoading } = useProducts();
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const product = products.find(item => item.id === id);
  useDocumentTitle(product ? product.name + ' - Royal Icing Catalog' : 'פרטי מוצר - Royal Icing Catalog');

  if (isLoading) return <div className="system-page brand-wrap"><p role="status">טוענת את פרטי העוגיות...</p></div>;
  if (!product) return (
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
          <p className="product-price-tag"><bdi>{formatPrice(product.price)}</bdi></p>
          <p className="product-desc-text">{product.description}</p>
          {product.category && <dl className="product-extra-details"><dt>קטגוריה</dt><dd>{productCategoryLabel(product.category)}</dd></dl>}
          <div className="product-order-actions">
            <Button className="order-now-btn" aria-describedby="order-availability">הזמנה אישית בווטסאפ</Button>
            <Link className="brand-text-link" to="/contact">לשאלות וליצירת קשר</Link>
          </div>
          <p className="form-note" id="order-availability">הזמנה ישירה בווטסאפ עדיין אינה זמינה באתר.</p>
        </div>
      </div>
      <ImageLightbox isOpen={isLightboxOpen} imageSrc={product.image || ''} imageAlt={product.name} onClose={() => setIsLightboxOpen(false)} />
    </div>
  );
}
