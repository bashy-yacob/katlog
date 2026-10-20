import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle, useProducts } from '@/hooks';
import type { Product, ProductInput } from '@/types';
import ProductMigration from '@/components/ProductMigration';
import { catalogError } from '@/api/catalog/validation';
import ProductModal from '@/components/ProductModal';
import PageHeading from '@/components/PageHeading';
import PageState from '@/components/PageState';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import ProductImage from '@/components/ProductImage';
import { formatPrice } from '@/utils/helpers';
import { productCategoryLabel } from '@/utils/presentation';
import './AdminProductsPage.css';

export default function AdminProductsPage() {
  useDocumentTitle('ניהול מוצרים - Royal Icing Catalog');
  const { products, isLoading, error, retry, isConfigured, newProductId, addProduct, updateProduct, deleteProduct } = useProducts(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const deleteInFlight = useRef(false);
  const [creationId, setCreationId] = useState('');

  const handleOpenModal = (product?: Product) => {
    if (!product) setCreationId(newProductId());
    setEditingProduct(product);
    setFeedback('');
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(undefined);
  };
  const handleSaveProduct = async (data: ProductInput) => {
    if (editingProduct) await updateProduct(editingProduct.id, data);
    else await addProduct(creationId, data);
    setFeedback(editingProduct ? 'פרטי המוצר עודכנו.' : 'המוצר נוסף לקטלוג.');
  };
  const handleDeleteProduct = async () => {
    if (!pendingDelete || deleteInFlight.current) return;
    deleteInFlight.current = true; setDeleting(true); setDeleteError('');
    try {
      await deleteProduct(pendingDelete.id);
      setPendingDelete(null);
      setFeedback('המוצר הוסר מהקטלוג.');
    } catch (cause) { setDeleteError(catalogError(cause)); }
    finally { deleteInFlight.current = false; setDeleting(false); }
  };

  return (
    <div className="admin-products-page">
      <PageHeading eyebrow="הקולקציה · סביבת ניהול" title="ניהול קטלוג מוצרים"
        description="מקום אחד להוספה, לעדכון ולסידור של העיצובים המוצגים באתר."
        actions={<Button disabled={!isConfigured} className="add-product-btn" onClick={() => handleOpenModal()}>+ הוסף מוצר חדש</Button>} />
      {isConfigured && <ProductMigration />}
      <div className="admin-products-toolbar"><p>העיצובים שלך</p><span>{products.length} מוצרים</span></div>
      <p className="ui-feedback" role="status">{feedback}</p>
      {!isConfigured ? <p className="ui-notice" role="alert">יש להשלים את חיבור Firebase לפני ניהול המוצרים.</p> : error ? <div><p className="form-error" role="alert">{catalogError(error)}</p><Button onClick={() => void retry()}>ניסיון נוסף</Button></div> : isLoading ? <p role="status">טוענת מוצרים...</p> : products.length === 0 ? (
        <PageState title="הקולקציה מתחילה כאן." description="עדיין אין מוצרים בקטלוג. הוסיפי את העיצוב הראשון, עם תמונה ופרטים, והוא יופיע בגלריה."
          action={<Button onClick={() => handleOpenModal()}>הוספת מוצר ראשון</Button>} />
      ) : (
        <div className="admin-products-list">
          {products.map(product => (
            <article key={product.id} className="admin-card">
              <Link className="admin-product-image" to={'/catalog/' + encodeURIComponent(product.id)} aria-label={'צפייה במוצר ' + product.name}>
                <ProductImage src={product.image} alt={product.name} fallback="אין תמונה" />
              </Link>
              <div className="admin-product-info">
                <p className="admin-product-category">{product.category ? productCategoryLabel(product.category) : 'ללא קטגוריה'}</p>
                <h2>{product.name}</h2>
                <p className="form-note">{product.isActive ? 'מוצג בקטלוג' : 'מוסתר מהקטלוג'}</p>
                <p className="admin-product-description">{product.description}</p>
              </div>
              <p className="admin-product-price"><bdi>{formatPrice(product.price)}</bdi></p>
              <div className="admin-product-actions">
                <Button tone="quiet" className="edit-btn button-compact" onClick={() => handleOpenModal(product)} aria-label={'עריכת ' + product.name}>עריכה</Button>
                <Button tone="danger" className="delete-btn button-compact" onClick={() => { setDeleteError(''); setPendingDelete(product); }} aria-label={'מחיקת ' + product.name}>מחיקה</Button>
              </div>
            </article>
          ))}
        </div>
      )}
      <ProductModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveProduct} initialProduct={editingProduct} />
      <Modal isOpen={!!pendingDelete} title="מחיקת מוצר" onClose={() => { if (!deleteInFlight.current) setPendingDelete(null); }} className="delete-product-modal">
        <div className="modal-body"><p>למחוק את ״{pendingDelete?.name}״ מהקטלוג?</p><p className="form-note">המוצר יוסר גם מהגלריה באתר.</p>{deleteError && <p className="form-error" role="alert">{deleteError}</p>}</div>
        <div className="modal-footer"><Button disabled={deleting} tone="quiet" onClick={() => setPendingDelete(null)}>ביטול</Button><Button disabled={deleting} tone="danger" onClick={() => void handleDeleteProduct()}>{deleting ? 'מוחקת...' : 'כן, למחוק מוצר'}</Button></div>
      </Modal>
    </div>
  );
}
