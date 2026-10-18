/**
 * 🎣 Custom Hook: useProducts
 * 
 * מטרה: ניהול רשימת המוצרים (קריאה, יצירה, עדכון, מחיקה)
 * 
 * זרימת נתונים:
 *   1️⃣ LOAD (Initial): 
 *       - useEffect מורץ בטעינה
 *       - קרא מ-localStorage בעזרת storage.getProducts()
 *       - שמור ב-state (products, isLoading)
 * 
 *   2️⃣ CREATE (הוספה):
 *       - Component קורא addProduct(data)
 *       → יצור ID ו-timestamp חדשים
 *       → שמור ב-localStorage (storage.addProduct)
 *       → עדכן את ה-state (setProducts)
 * 
 *   3️⃣ UPDATE (עדכון):
 *       - Component קורא updateProduct(id, data)
 *       → חפש מוצר בID
 *       → עדכן ב-localStorage (storage.updateProduct)
 *       → עדכן ב-state (setProducts)
 * 
 *   4️⃣ DELETE (מחיקה):
 *       - Component קורא deleteProduct(id)
 *       → מחק מ-localStorage (storage.deleteProduct)
 *       → עדכן ב-state (setProducts)
 * 
 * פלט: Object עם:
 *   - products: מערך המוצרים
 *   - isLoading: bool בטעינה?
 *   - addProduct, updateProduct, deleteProduct: פונקציות
 * 
 * הערה: כרגע משתמשים ב-localStorage (storage.ts)
 *       בעתיד: יחליפו ל-Firebase Firestore queries + mutations
 */
import { useState, useEffect } from 'react';
import type { Product } from '@/types';
import { storage } from '@/utils/storage';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = storage.getProducts();
    setProducts(stored);
    setIsLoading(false);
  }, []);

  const addProduct = (product: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    storage.addProduct(newProduct);
    setProducts((prev) => [...prev, newProduct]);
  };

  const updateProduct = (id: string, product: Omit<Product, 'id' | 'createdAt'>) => {
    const updated = products.find((p) => p.id === id);
    if (updated) {
      const updatedProduct = { ...updated, ...product };
      storage.updateProduct(id, updatedProduct);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? updatedProduct : p))
      );
    }
  };

  const deleteProduct = (id: string) => {
    storage.deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    products,
    isLoading,
    addProduct,
    updateProduct,
    deleteProduct,
  };
};
