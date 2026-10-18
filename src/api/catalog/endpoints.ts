/**
 * Catalog API Endpoints
 * כל פונקציות שעובדות עם מוצרים בקטלוג
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { Product } from '@/types'

const PRODUCTS_COLLECTION = 'products'
const QUERY_KEY = 'products'

// ============================================================
// 📖 QUERIES (קריאת נתונים)
// ============================================================

/**
 * קבל את כל המוצרים
 */
export const useGetProducts = () => {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const q = query(
        collection(db, PRODUCTS_COLLECTION),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (Product & { id: string })[]
    },
  })
}

/**
 * קבל מוצר יחיד לפי ID
 */
export const useGetProductById = (productId: string | undefined) => {
  return useQuery({
    queryKey: [QUERY_KEY, productId],
    queryFn: async () => {
      if (!productId) return null
      const docRef = doc(db, PRODUCTS_COLLECTION, productId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Product & { id: string }
      }
      return null
    },
    enabled: !!productId,
  })
}

/**
 * חפש מוצרים לפי שם או קטגוריה
 */
export const useSearchProducts = (searchTerm: string) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'search', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) {
        const snapshot = await getDocs(
          collection(db, PRODUCTS_COLLECTION)
        )
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as (Product & { id: string })[]
      }

      // חפש לפי שם
      const q = query(
        collection(db, PRODUCTS_COLLECTION),
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (Product & { id: string })[]
    },
    enabled: true,
  })
}

// ============================================================
// ✏️ MUTATIONS (עדכון/מחיקה/הוספה)
// ============================================================

/**
 * הוסף מוצר חדש
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (product: Omit<Product, 'id'>) => {
      const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
        ...product,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      return {
        id: docRef.id,
        ...product,
      }
    },
    onSuccess: () => {
      // רענן את רשימת המוצרים
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

/**
 * עדכן מוצר קיים
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Product>
    }) => {
      const docRef = doc(db, PRODUCTS_COLLECTION, id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      })
      return { id, ...updates }
    },
    onSuccess: (data) => {
      // רענן את המוצר ספציפי
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, data.id],
      })
      // רענן את כל המוצרים
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

/**
 * מחק מוצר
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      const docRef = doc(db, PRODUCTS_COLLECTION, productId)
      await deleteDoc(docRef)
      return productId
    },
    onSuccess: () => {
      // רענן את כל המוצרים
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}
