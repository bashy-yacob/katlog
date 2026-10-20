import { useMemo } from 'react';
import { useGetProductById, useGetProducts, useSaveProduct, useDeleteProduct, productRepository } from '@/api/catalog/endpoints';
import { storage } from '@/utils/storage';
import type { ProductInput } from '@/types';

// Local data remains read-only until the administrator explicitly imports it.
export function useProducts(admin = false) {
  const list = useGetProducts(admin);
  const save = useSaveProduct();
  const remove = useDeleteProduct();
  const localProducts = useMemo(() => productRepository ? [] : storage.getProducts(), []);
  return {
    products: productRepository ? list.data ?? [] : admin ? [] : localProducts,
    isLoading: Boolean(productRepository) && list.isPending && list.fetchStatus !== 'idle',
    error: list.error,
    retry: () => list.refetch(),
    isConfigured: Boolean(productRepository),
    newProductId: () => {
      if (!productRepository) throw new Error('חיבור הקטלוג טרם הוגדר.');
      return productRepository.newId();
    },
    addProduct: (id: string, input: ProductInput) => save.mutateAsync({ id, input, mode: 'create' }),
    updateProduct: (id: string, input: ProductInput) => save.mutateAsync({ id, input, mode: 'update' }),
    deleteProduct: (id: string) => remove.mutateAsync(id),
  };
}

export function useProduct(id: string | undefined) {
  const result = useGetProductById(id);
  const localProduct = useMemo(() => !productRepository ? storage.getProducts().find(item => item.id === id) : undefined, [id]);
  return {
    product: productRepository ? result.data : localProduct,
    isLoading: Boolean(productRepository) && result.isPending && result.fetchStatus !== 'idle',
    error: result.error,
    retry: () => result.refetch(),
  };
}
