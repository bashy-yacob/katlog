import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { Product } from '@/types';
import ImageUpload from './ImageUpload';
import Modal from './Modal';
import Button from './Button';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  initialProduct?: Product;
}

export default function ProductModal({ isOpen, onClose, onSave, initialProduct }: ProductModalProps) {
  const [formData, setFormData] = useState({ name:'', description:'', price:0, category:'', image:'' });
  const [error, setError] = useState('');
  useEffect(() => {
    setFormData(initialProduct ? {
      name: initialProduct.name || '', description: initialProduct.description || '', price: initialProduct.price || 0,
      category: initialProduct.category || '', image: initialProduct.image || '',
    } : { name:'', description:'', price:0, category:'', image:'' });
    setError('');
  }, [initialProduct, isOpen]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData(previous => ({ ...previous, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
    setError('');
  };
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!formData.name || !formData.price || !formData.image) { setError('אנא מלא את כל השדות הנדרשים'); return; }
    try {
      onSave(formData);
      setFormData({ name:'', description:'', price:0, category:'', image:'' });
    } catch {
      setError('לא הצלחנו לשמור את המוצר. הפרטים שמילאת נשמרו בטופס, ואפשר לנסות שוב.');
    }
  };

  return (
    <Modal isOpen={isOpen} title={initialProduct ? 'עריכת מוצר' : 'הוסף מוצר חדש'} onClose={onClose} className="product-modal">
      <form className="brand-form" onSubmit={handleSubmit}>
        <div className="modal-body">
          <p className="form-note" style={{ marginBottom: '20px' }}>השדות המסומנים בכוכבית הם שדות חובה.</p>
          <div className="form-grid">
            <div className="form-group form-group-wide"><label htmlFor="name">שם המוצר *</label><input id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} placeholder="לדוגמה: עוגיות כלה" required /></div>
            <div className="form-group"><label htmlFor="price">מחיר (₪) *</label><input id="price" name="price" type="number" value={formData.price} onChange={handleInputChange} min="0" step="0.01" required /></div>
            <div className="form-group"><label htmlFor="category">קטגוריה</label><select id="category" name="category" value={formData.category} onChange={handleInputChange}><option value="">בחר קטגוריה</option><option value="cookies">עוגיות</option><option value="cakes">עוגות</option><option value="cupcakes">קאפקייקס</option><option value="custom">עיצוב מותאם</option></select></div>
            <div className="form-group form-group-wide"><label htmlFor="description">תיאור</label><textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={4} placeholder="תיאור המוצר..." /></div>
            <div className="form-group form-group-wide"><span className="form-note">תמונת המוצר *</span><ImageUpload onImageSelect={image => { setFormData(previous => ({ ...previous, image })); setError(''); }} currentImage={formData.image} /></div>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
        <div className="modal-footer"><Button tone="quiet" className="modal-close-btn" onClick={onClose}>ביטול</Button><Button type="submit" className="product-save-btn">{initialProduct ? 'עדכן' : 'הוסף למוצרים'}</Button></div>
      </form>
    </Modal>
  );
}
