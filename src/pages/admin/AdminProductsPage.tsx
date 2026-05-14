import { useState } from 'react';
import { useDocumentTitle, useProducts } from '@/hooks';
import { Product } from '@/types';
import ProductModal from '@/components/ProductModal';
import './AdminProductsPage.css'; // ייבוא ה-CSS

export default function AdminProductsPage() {
  useDocumentTitle('ניהול מוצרים - Royal Icing Catalog');

  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  const handleOpenModal = (product?: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(undefined);
  };

  const handleSaveProduct = (productData: Omit<Product, 'id' | 'createdAt'>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
    } else {
      addProduct(productData);
    }
    handleCloseModal();
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את המוצר הזה?')) {
      deleteProduct(productId);
    }
  };

  return (
    <div className="admin-products-container">
      <div className="admin-header">
        <h1>ניהול קטלוג מוצרים</h1>
        <button className="add-product-btn" onClick={() => handleOpenModal()}>
          + הוסף מוצר חדש
        </button>
      </div>

      <div className="admin-products-grid">
        {products.map((product) => (
          <div key={product.id} className="admin-card">
            <div className="product-image">
              {product.image ? (
                <img src={product.image} alt={product.name} />
              ) : (
                <div className="image-placeholder">אין תמונה</div>
              )}
            </div>
            <div className="product-info">
              <p className="category">{product.category || 'ללא קטגוריה'}</p>
              <h3>{product.name}</h3>
              <p className="description">{product.description}</p>
              <p className="price">₪{product.price.toFixed(2)}</p>
            </div>
            <div className="product-actions">
              <button className="edit-btn" onClick={() => handleOpenModal(product)}>
                עריכה
              </button>
              <button className="delete-btn" onClick={() => handleDeleteProduct(product.id)}>
                מחיקה
              </button>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="empty-state">
          <p>הקטלוג ריק. זה הזמן להעלות יצירות חדשות!</p>
        </div>
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProduct}
        initialProduct={editingProduct}
      />
    </div>
  );
}