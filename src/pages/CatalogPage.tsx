import { useDocumentTitle, useProducts } from '@/hooks';
import { Link } from 'react-router-dom';
import './CatalogPage.css';

export default function CatalogPage() {
  useDocumentTitle('קטלוג - Royal Icing Catalog');
  const { products, isLoading } = useProducts();

  return (
    <div className="catalog-container">
      <h1 className="catalog-title">קטלוג עוגיות מעוצבות</h1>

      {isLoading ? (
        <p>טוען מוצרים...</p>
      ) : products.length === 0 ? (
        <p>אין מוצרים בקטלוג עדיין.</p>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              {/* הצגת התמונה או placeholder */}
              <div className="product-image-placeholder">
                {product.image ? (
                  <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>תמונת מוצר</span>
                )}
              </div>
              
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <Link to={`/catalog/${product.id}`} className="product-link">
                  צפה בפרטים
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}