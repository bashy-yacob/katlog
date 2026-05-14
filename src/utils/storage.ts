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
