import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentTitle, useProducts } from '@/hooks';
import ImageLightbox from '@/components/ImageLightbox';
import { useState } from 'react';
import './ProductDetailPage.css';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products } = useProducts();
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // חיפוש המוצר בנתונים לפי ID
  const product = products.find((p) => p.id === id);

  useDocumentTitle(product ? `${product.name} - Royal Icing Catalog` : 'המוצר לא נמצא - Royal Icing Catalog');

  // אם המוצר לא נמצא, הצג הודעת שגיאה
  if (!product) {
    return (
      <div className="product-detail-container">
        <button className="back-button" onClick={() => navigate('/catalog')}>
          <span>←</span> חזרה לקטלוג
        </button>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>המוצר לא נמצא</h2>
          <p>סליחה, המוצר שחיפשת אינו קיים בקטלוג.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      <button className="back-button" onClick={() => navigate('/catalog')}>
        <span>←</span> חזרה לקטלוג
      </button>

      <div className="product-main-layout">
        {/* צד שמאל - תמונה */}
        <div className="product-image-gallery" onClick={() => product.image && setIsLightboxOpen(true)} style={{ cursor: product?.image ? 'pointer' : 'default' }}>
          {product.image ? (
            <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span>תמונת תקריב של האמנות</span>
          )}
        </div>

        {/* צד ימין - תוכן */}
        <div className="product-content-side">
          <h1 className="product-title-detail">{product.name}</h1>
          <span className="product-price-tag">₪{product.price}</span>
          
          <p className="product-desc-text">{product.description}</p>
          
          {product.category && (
            <div className="product-extra-details">
              <strong>קטגוריה:</strong>
              <p style={{ marginTop: '10px' }}>{product.category}</p>
            </div>
          )}

          <button className="order-now-btn">
            הזמנה אישית בווטסאפ
          </button>
        </div>
      </div>

      <ImageLightbox
        isOpen={isLightboxOpen}
        imageSrc={product.image || ''}
        imageAlt={product.name}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
}