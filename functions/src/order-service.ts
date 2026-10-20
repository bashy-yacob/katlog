import { createHash, createHmac, randomBytes } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { OrderValidationError, validPickupDate, validateOrderRequest } from './order-validation.js';
import type { OrderReceipt } from './order-validation.js';
import { createNewOrder, orderProductSnapshot } from './order-model.js';

export const ORDER_LIMITS = { ip: 5, phone: 3, global: 100 };
export async function createOrder(db: Firestore, raw: unknown, ip: string, secret: string, now = new Date()): Promise<OrderReceipt> {
  if (!ip || secret.length < 32) throw new HttpsError('unavailable', 'שירות ההזמנות אינו זמין כרגע.');
  let input;
  try { input = validateOrderRequest(raw, now, false); }
  catch (error) {
    if (error instanceof OrderValidationError) throw new HttpsError('invalid-argument', 'בדקי את השדות המסומנים.', { fields: error.fields });
    throw error;
  }
  const { idempotencyKey, ...details } = input;
  const hash = (value: string) => createHmac('sha256', secret).update(value).digest('hex');
  const requestHash = hash(JSON.stringify(details));
  const receiptRef = db.collection('_orderRequests').doc(createHash('sha256').update(idempotencyKey).digest('hex'));
  const productRef = db.collection('products').doc(input.productId);
  const orderNumber = `RI-${randomBytes(10).toString('hex').toUpperCase()}`;
  const orderRef = db.collection('orders').doc(orderNumber);
  const bucket = (duration: number) => Math.floor(now.getTime() / duration);
  const windows = [
    { key: `ip:${ip.replace(/^::ffff:/, '')}:${bucket(15 * 60_000)}`, limit: ORDER_LIMITS.ip },
    { key: `phone:${input.customerPhone.replace(/^\+/, '')}:${bucket(60 * 60_000)}`, limit: ORDER_LIMITS.phone },
    { key: `global:${bucket(10 * 60_000)}`, limit: ORDER_LIMITS.global },
  ].map(item => ({ ...item, ref: db.collection('_orderRateLimits').doc(hash(item.key)) }));

  return db.runTransaction(async transaction => {
    const previous = await transaction.get(receiptRef);
    if (previous.exists) {
      const receipt = previous.data()!;
      if (receipt.requestHash !== requestHash) throw new HttpsError('failed-precondition', 'מזהה הבקשה כבר שימש לפרטים אחרים.');
      return { orderNumber: receipt.orderNumber as string };
    }
    if (!validPickupDate(input.requestedPickupDate, now)) throw new HttpsError('invalid-argument', 'תאריך האיסוף אינו תקין.', { fields: { requestedPickupDate: 'יש לבחור תאריך שאינו בעבר.' } });
    const product = await transaction.get(productRef);
    if (!product.exists || product.data()?.isActive !== true) throw new HttpsError('not-found', 'המוצר אינו זמין להזמנה.');
    const productData = product.data()!;
    let snapshot;
    try { snapshot = orderProductSnapshot(productData); }
    catch { throw new HttpsError('failed-precondition', 'המוצר אינו זמין להזמנה.'); }
    const counters = await transaction.getAll(...windows.map(item => item.ref));
    if (counters.some((counter, index) => (counter.data()?.count ?? 0) >= windows[index].limit)) throw new HttpsError('resource-exhausted', 'נשלחו בקשות רבות מדי. נסי שוב מאוחר יותר.');
    // All reads precede writes. Product and rate limits are checked atomically.
    const receipt = { orderNumber };
    transaction.create(orderRef, createNewOrder(details, snapshot, orderNumber, FieldValue.serverTimestamp()));
    // No customer information or IP address is copied into abuse-control records.
    transaction.create(receiptRef, { requestHash, ...receipt, createdAt: FieldValue.serverTimestamp() });
    windows.forEach((window, index) => transaction.set(window.ref, { count: (counters[index].data()?.count ?? 0) + 1, expiresAt: Timestamp.fromMillis(now.getTime() + 24 * 60 * 60_000) }));
    return receipt;
  });
}
