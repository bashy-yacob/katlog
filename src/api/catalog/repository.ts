import { collection, doc, getDocFromServer, getDocsFromServer, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import type { Firestore, DocumentData } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import type { Product, ProductInput } from '../../types/index.ts';
import { validateProduct } from './validation.ts';
import { decodeDataImage, uploadProductImage } from './images.ts';

// SDK reads may wait indefinitely after a browser loses its connection. A failed
// preflight never advances to a write; a late acknowledgement uses the same ID.
function serverResult<T>(operation: Promise<T>, milliseconds = 10000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Object.assign(new Error('Server response timed out'), { code: 'unavailable' })), milliseconds);
    operation.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });
}

function decodeProduct(id: string, data: DocumentData, allowEmulator: boolean): Product {
  const values = validateProduct({ name: data.name, description: data.description ?? '', price: data.price, image: data.image, category: data.category, isActive: data.isActive === true }, false, allowEmulator);
  return { id, ...values, createdAt: data.createdAt?.toDate?.(), updatedAt: data.updatedAt?.toDate?.() };
}
function productRef(db: Firestore, id: string) {
  if (!id || id === '.' || id === '..' || id.includes('/') || new TextEncoder().encode(id).length > 1500) throw new Error('מזהה המוצר אינו תקין.');
  return doc(db, 'products', id);
}

export function createProductRepository(db: Firestore, storage: FirebaseStorage | null) {
  const allowEmulator = db.app.options.projectId === 'demo-royal-icing';
  return {
    async existingIds() {
      return new Set((await serverResult(getDocsFromServer(collection(db, 'products')))).docs.map(item => item.id));
    },
    async list(admin = false) {
      const source = collection(db, 'products');
      const snapshot = await serverResult(getDocsFromServer(admin ? source : query(source, where('isActive', '==', true))));
      return snapshot.docs.map(item => decodeProduct(item.id, item.data(), allowEmulator)).sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0) || a.id.localeCompare(b.id));
    },
    async get(id: string) {
      const snapshot = await serverResult(getDocFromServer(productRef(db, id)));
      return snapshot.exists() ? decodeProduct(snapshot.id, snapshot.data(), allowEmulator) : null;
    },
    newId() { return doc(collection(db, 'products')).id; },
    async save(id: string, input: ProductInput, mode: 'create' | 'update' | 'import', importedDate?: Date) {
      const target = productRef(db, id);
      // Validate everything before uploading. Data URLs never enter a Firestore document.
      const values = validateProduct(input, true, allowEmulator);
      const acknowledged = await serverResult(getDocFromServer(target));
      if (mode === 'import' && acknowledged.exists()) return false;
      if (values.image?.startsWith('data:')) {
        if (!storage) throw new Error('אחסון התמונות אינו מוגדר.');
        const image = decodeDataImage(values.image);
        values.image = await uploadProductImage(storage, image.bytes, image.type);
      }
      validateProduct(values, false, allowEmulator);
      return serverResult(runTransaction(db, async transaction => {
        const existing = await transaction.get(target);
        if (mode === 'import' && existing.exists()) return false;
        if (mode === 'create' && existing.exists()) {
          // The acknowledgement of an earlier save may have been lost.
          const previous = existing.data();
          if (Object.entries(values).every(([key, value]) => previous[key] === value)) return false;
          throw new Error('מוצר עם מזהה זה כבר קיים.');
        }
        if (mode === 'update' && !existing.exists()) throw new Error('המוצר אינו קיים עוד. רענני את הרשימה.');
        const createdAt = existing.exists() ? existing.data().createdAt : importedDate ?? serverTimestamp();
        transaction.set(target, { ...values, createdAt, updatedAt: serverTimestamp() });
        return true;
      }, { maxAttempts: 3 }), 30000);
    },
    async remove(id: string) {
      // Never delete a referenced Storage asset; another product may use it.
      const target = productRef(db, id);
      await serverResult(getDocFromServer(target));
      await serverResult(runTransaction(db, async transaction => {
        await transaction.get(target);
        transaction.delete(target);
      }, { maxAttempts: 3 }), 30000);
    },
  };
}
