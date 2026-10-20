import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { Product, ProductInput } from '@/types';
import { catalogError, validateProduct } from '@/api/catalog/validation';
import ImageUpload from './ImageUpload';
import Modal from './Modal';
import Button from './Button';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: ProductInput) => Promise<unknown>;
  initialProduct?: Product;
}

export default function ProductModal({ isOpen, onClose, onSave, initialProduct }: ProductModalProps) {
  const [formData, setFormData] = useState({ name:'', description:'', price:0, category:'', image:'', isActive: true });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [readingImage, setReadingImage] = useState(false);
  const submitting = useRef(false);
  useEffect(() => {
    setFormData(initialProduct ? {
      name: initialProduct.name || '', description: initialProduct.description || '', price: initialProduct.price || 0,
      category: initialProduct.category || '', image: initialProduct.image || '', isActive: initialProduct.isActive === true,
    } : { name:'', description:'', price:0, category:'', image:'', isActive: true });
    setError('');
  }, [initialProduct, isOpen]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData(previous => ({ ...previous, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
    setError('');
  };
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting.current || readingImage) return;
    if (!formData.name || !formData.image) { setError('אנא מלאי את כל השדות הנדרשים'); return; }
    try { validateProduct(formData, true); } catch (cause) { setError(cause instanceof Error ? cause.message : 'בדקי את פרטי המוצר.'); return; }
    submitting.current = true; setSaving(true); setError('');
    try {
      await onSave(formData);
      onClose();
    } catch (cause) { setError(catalogError(cause)); }
    finally { submitting.current = false; setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} title={initialProduct ? 'עריכת מוצר' : 'הוסף מוצר חדש'} onClose={() => { if (!submitting.current && !readingImage) onClose(); }} className="product-modal">
      <form className="brand-form" onSubmit={handleSubmit}>
        <div className="modal-body">
          <p className="form-note" style={{ marginBottom: '20px' }}>השדות המסומנים בכוכבית הם שדות חובה.</p>
          <fieldset className="product-fields" disabled={saving || readingImage}><div className="form-grid">
            <div className="form-group form-group-wide"><label htmlFor="name">שם המוצר *</label><input id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} placeholder="לדוגמה: עוגיות כלה" required /></div>
            <div className="form-group"><label htmlFor="price">מחיר התחלתי (₪) *</label><input id="price" name="price" type="number" value={formData.price} onChange={handleInputChange} min="0" max="1000000" step="0.01" required /><p className="form-note">המחיר הסופי ייקבע לאחר בדיקת בקשת ההזמנה.</p></div>
            <div className="form-group"><label htmlFor="category">קטגוריה</label><select id="category" name="category" value={formData.category} onChange={handleInputChange}><option value="">בחר קטגוריה</option>{formData.category && !['cookies', 'cakes', 'cupcakes', 'custom'].includes(formData.category) && <option value={formData.category}>{formData.category}</option>}<option value="cookies">עוגיות</option><option value="cakes">עוגות</option><option value="cupcakes">קאפקייקס</option><option value="custom">עיצוב מותאם</option></select></div>
            <div className="form-group form-group-wide"><label htmlFor="description">תיאור</label><textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={4} placeholder="תיאור המוצר..." /></div>
            <div className="form-group form-group-wide"><span className="form-note">תמונת המוצר *</span><ImageUpload onBusyChange={setReadingImage} onImageSelect={image => { setFormData(previous => ({ ...previous, image })); setError(''); }} currentImage={formData.image} /></div>
            <div className="form-group form-group-wide"><label className="migration-confirm"><input type="checkbox" checked={formData.isActive} onChange={event => setFormData(previous => ({ ...previous, isActive: event.target.checked }))} />הצגת המוצר בקטלוג הציבורי</label></div>
          </div></fieldset>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
        <div className="modal-footer"><Button tone="quiet" className="modal-close-btn" disabled={saving || readingImage} onClick={onClose}>ביטול</Button><Button type="submit" disabled={saving || readingImage} className="product-save-btn">{saving ? 'שומרת מוצר...' : initialProduct ? 'עדכן' : 'הוסף למוצרים'}</Button></div>
      </form>
    </Modal>
  );
}
