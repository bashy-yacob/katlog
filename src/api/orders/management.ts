import { collection, doc, getDocFromServer, getDocsFromServer, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { createOrderManagementPatch } from '../../../functions/src/order-model.ts';
import type { Order, OrderManagementInput } from '../../../functions/src/order-model.ts';
import { orderFromFirestore } from './serialization.ts';

export interface ManagedOrder { order: Order; revision: string }
function revision(value: unknown) {
  if (!(value instanceof Timestamp)) throw new Error('תאריך העדכון אינו תקין.');
  return `${value.seconds}:${value.nanoseconds}`;
}
function online<T>(operation: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('לא התקבל אישור מהשרת. רענני את הרשימה לפני ניסיון נוסף.')), 15000);
    operation.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });
}
export function managementError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === 'permission-denied' || code === 'unauthenticated') return 'אין הרשאה לניהול הזמנות. התחברי מחדש.';
  if (error instanceof Error && !code) return error.message;
  return 'לא ניתן להשלים את הפעולה. בדקי את החיבור ונסי שוב.';
}
export function createOrderRepository(db: Firestore) {
  return {
    async list() {
      const snapshot = await online(getDocsFromServer(collection(db, 'orders')));
      const orders: ManagedOrder[] = [];
      let invalidCount = 0;
      for (const item of snapshot.docs) {
        try { orders.push({ order: orderFromFirestore(item.id, item.data()), revision: revision(item.data().updatedAt) }); }
        catch { invalidCount++; }
      }
      orders.sort((a, b) => b.order.createdAt.getTime() - a.order.createdAt.getTime() || a.order.id.localeCompare(b.order.id));
      return { orders, invalidCount };
    },
    async update(entry: ManagedOrder, input: OrderManagementInput, actorUid: string) {
      if (!entry.order.id || entry.order.id.includes('/')) throw new Error('מזהה ההזמנה אינו תקין.');
      const patch = createOrderManagementPatch(input, actorUid, serverTimestamp());
      const target = doc(db, 'orders', entry.order.id);
      await online(getDocFromServer(target));
      // No timeout around the write: never offer a second save while a first
      // transaction could still commit. The SDK bounds transaction retries.
      await runTransaction(db, async transaction => {
        const current = await transaction.get(target);
        if (!current.exists()) throw new Error('ההזמנה אינה קיימת עוד. רענני את הרשימה.');
        if (revision(current.data().updatedAt) !== entry.revision) throw new Error('ההזמנה השתנתה בחלון אחר. הפרטים שהקלדת נשמרו כאן; סגרי ורענני לפני עריכה מחדש.');
        transaction.update(target, { ...patch });
      }, { maxAttempts: 3 });
    },
  };
}
