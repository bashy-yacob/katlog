import { Timestamp } from 'firebase/firestore';
import { decodeOrder } from '../../../functions/src/order-model.ts';

export function orderFromFirestore(id: string, data: unknown) {
  return decodeOrder(id, data, value => {
    if (!(value instanceof Timestamp)) throw new Error('תאריך ההזמנה אינו תקין.');
    return value.toDate();
  });
}
