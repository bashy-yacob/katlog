/**
 * 💾 Storage Utility - ניהול הנתונים ב-localStorage
 * 
 * מטרה: שמירה וטעינה של מוצרים מ-localStorage (זיכרון מקומי)
 * 
 * הערה: זה זמני לפי בנייה של הפרויקט
 *       בעתיד: יחליפו ל-Firebase Firestore
 * 
 * פונקציות:
 *   1. getProducts() → קרא את כל המוצרים מ-localStorage
 *   2. saveProducts() → שמור רשימה שלמה ב-localStorage
 *   3. addProduct() → הוסף מוצר חדש לרשימה
 *   4. updateProduct() → עדכן מוצר קיים
 *   5. deleteProduct() → מחק מוצר
 *   6. initializeWithDefaults() → אתחול עם ערכי ברירת מחדל
 * 
 * זרימת נתונים:
 *   useProducts hook → storage.getProducts() → localStorage → Component
 *   Component → useProducts.addProduct() → storage.addProduct() → localStorage
 * 
 * מבנה localStorage:
 *   Key: 'royal-icing-products'
 *   Value: JSON array של Product objects
 */
import type { Product } from '@/types';

const PRODUCTS_STORAGE_KEY = 'royal-icing-products';

export const storage = {
  getProducts: (): Product[] => {
    try {
      const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveProducts: (products: Product[]): void => {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  },

  addProduct: (product: Product): void => {
    const products = storage.getProducts();
    products.push(product);
    storage.saveProducts(products);
  },

  updateProduct: (id: string, product: Product): void => {
    const products = storage.getProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index !== -1) {
      products[index] = product;
      storage.saveProducts(products);
    }
  },

  deleteProduct: (id: string): void => {
    const products = storage.getProducts();
    const filtered = products.filter((p) => p.id !== id);
    storage.saveProducts(filtered);
  },

  initializeWithDefaults: (defaults: Product[]): void => {
    const existing = storage.getProducts();
    if (existing.length === 0) {
      storage.saveProducts(defaults);
    }
  },
};
