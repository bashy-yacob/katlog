import { useState, useEffect } from 'react';
import { Product } from '@/types';
import ImageUpload from './ImageUpload';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  initialProduct?: Product;
}

export default function ProductModal({
  isOpen,
  onClose,
  onSave,
  initialProduct,
}: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '',
  });

  // Update form data when initialProduct changes
  useEffect(() => {
    if (initialProduct) {
      setFormData({
        name: initialProduct.name || '',
        description: initialProduct.description || '',
        price: initialProduct.price || 0,
        category: initialProduct.category || '',
        image: initialProduct.image || '',
      });
    } else {
      setFormData({ name: '', description: '', price: 0, category: '', image: '' });
    }
  }, [initialProduct, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleImageSelect = (imageData: string) => {
    setFormData((prev) => ({
      ...prev,
      image: imageData,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.image) {
      alert('אנא מלא את כל השדות הנדרשים');
      return;
    }
    onSave(formData);
    setFormData({ name: '', description: '', price: 0, category: '', image: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content product-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialProduct ? 'עריכת מוצר' : 'הוסף מוצר חדש'}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="name">שם המוצר *</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="לדוגמה: עוגיות כלה"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">מחיר (₪) *</label>
              <input
                id="price"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="100"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">קטגוריה</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="">בחר קטגוריה</option>
                <option value="cookies">עוגיות</option>
                <option value="cakes">עוגות</option>
                <option value="cupcakes">קאפקייקס</option>
                <option value="custom">עיצוב מותאם</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">תיאור</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="תיאור המוצר..."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>תמונת המוצר *</label>
              <ImageUpload onImageSelect={handleImageSelect} currentImage={formData.image} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="modal-close-btn" onClick={onClose}>
              ביטול
            </button>
            <button type="submit" className="product-save-btn">
              {initialProduct ? 'עדכן' : 'הוסף למוצרים'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
