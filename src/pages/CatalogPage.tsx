import { Link } from 'react-router-dom';
import { useDocumentTitle, useProducts } from '@/hooks';
import CatalogProductCard from '@/components/CatalogProductCard';
import './CatalogPage.css';

export default function CatalogPage() {
  useDocumentTitle('קטלוג עוגיות מעוצבות - Royal Icing');
  const { products, isLoading } = useProducts();

  return (
    <div className="catalog-page brand-wrap">
      <nav className="catalog-breadcrumb" aria-label="מיקום באתר">
        <Link to="/">דף הבית</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">גלריית העוגיות</span>
      </nav>

      <header className="catalog-intro">
        <div>
          <p className="catalog-eyebrow">רויאל אייסינג · עבודת יד</p>
          <h1>קטלוג <em>עוגיות מעוצבות</em></h1>
        </div>
        <p className="catalog-intro-copy">
          יצירות קטנות של טעם וצבע, שנוצרות אחת־אחת עם תשומת לב לכל פרט.
          לאירוע, למתנה, או לרגע קטן של מתוק.
        </p>
      </header>

      <section className="catalog-collection" aria-label="קולקציית העוגיות" aria-busy={isLoading}>
        {isLoading ? (
          <div className="catalog-loading" role="status">
            <p>טוענת את העוגיות...</p>
            <div className="catalog-grid" aria-hidden="true">
              <div className="catalog-loading-tile" />
              <div className="catalog-loading-tile" />
              <div className="catalog-loading-tile" />
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="catalog-empty">
            <span className="catalog-empty-mark" aria-hidden="true" />
            <h2>משהו מתוק מתבשל כאן...</h2>
            <p>בקרוב תמצאי כאן קולקציה של עוגיות מעוצבות בעבודת יד.</p>
            <Link className="brand-button primary" to="/contact">בינתיים, בואי נדבר</Link>
          </div>
        ) : (
          <>
            <div className="catalog-collection-heading">
              <p>הקולקציה</p>
              <span>{products.length === 1 ? 'עיצוב אחד' : products.length + ' עיצובים'}</span>
            </div>
            <div className="catalog-grid">
              {products.map(product => <CatalogProductCard key={product.id} product={product} />)}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
