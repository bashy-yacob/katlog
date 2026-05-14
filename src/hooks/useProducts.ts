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
