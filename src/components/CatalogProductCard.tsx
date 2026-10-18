import { Link } from 'react-router-dom';
import type { Product } from '@/types';
import ProductImage from './ProductImage';

const currency = new Intl.NumberFormat('he-IL', {
  style: 'currency', currency: 'ILS', minimumFractionDigits: 0, maximumFractionDigits: 2,
});

/** A product's existing image, details and price, linked to its existing route. */
export default function CatalogProductCard({ product }: { product: Product }) {
  return (
    <article className="catalog-product">
      <Link className="catalog-product-link" to={`/catalog/${product.id}`}>
        <div className="catalog-product-image">
          <ProductImage src={product.image} alt={product.name} />
        </div>
        <div className="catalog-product-copy">
          <h2>{product.name}</h2>
          {product.description && <p className="catalog-product-description">{product.description}</p>}
          <div className="catalog-product-bottom">
            <span className="catalog-product-price"><bdi>{currency.format(product.price)}</bdi></span>
            <span className="brand-text-link">לפרטים ולהזמנה <span aria-hidden="true">←</span></span>
          </div>
        </div>
      </Link>
    </article>
  );
}
