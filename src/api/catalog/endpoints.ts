import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db, storage } from '@/config/firebase';
import { useAdminAuth } from '@/auth/auth-context';
import { createProductRepository } from './repository';
import type { ProductInput } from '@/types';

export const productRepository = db ? createProductRepository(db, storage) : null;
function requireRepository() {
  if (!productRepository) throw new Error('חיבור הקטלוג טרם הוגדר.');
  return productRepository;
}
export function useGetProducts(admin = false) {
  const { status } = useAdminAuth();
  return useQuery({
    queryKey: ['products', admin ? 'admin' : 'public'],
    queryFn: () => requireRepository().list(admin),
    enabled: Boolean(db) && (!admin || status === 'admin'),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
    retry: 1,
  });
}
export function useGetProductById(id: string | undefined) {
  return useQuery({
    queryKey: ['products', 'detail', id],
    queryFn: () => requireRepository().get(id!),
    enabled: Boolean(db && id),
    staleTime: 0, refetchOnMount: 'always', refetchOnWindowFocus: true,
    refetchInterval: 15000, retry: false,
  });
}
export function useSaveProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input, mode }: { id: string; input: ProductInput; mode: 'create' | 'update' }) => requireRepository().save(id, input, mode),
    retry: false,
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['products'] }); },
  });
}
export function useDeleteProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => requireRepository().remove(id),
    retry: false,
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['products'] }); },
  });
}
