import { createHash, createHmac, randomBytes } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { LeadValidationError, validateLeadRequest } from './lead-validation.js';
import type { LeadReceipt } from './lead-validation.js';

export const LEAD_LIMITS = { ip: 5, phone: 3, global: 100 };
export async function createLead(db: Firestore, raw: unknown, ip: string, secret: string, now = new Date()): Promise<LeadReceipt> {
  if (!ip || secret.length < 32) throw new HttpsError('unavailable', 'שירות הפניות אינו זמין כרגע.');
  let input;
  try { input = validateLeadRequest(raw); }
  catch (error) {
    if (error instanceof LeadValidationError) throw new HttpsError('invalid-argument', 'בדקי את השדות המסומנים.', { fields: error.fields });
    throw error;
  }
  const { idempotencyKey, ...details } = input;
  const hash = (value: string) => createHmac('sha256', secret).update(value).digest('hex');
  const requestHash = hash(JSON.stringify(details));
  const receiptRef = db.collection('_leadRequests').doc(createHash('sha256').update(idempotencyKey).digest('hex'));
  const leadNumber = `CF-${randomBytes(10).toString('hex').toUpperCase()}`;
  const leadRef = db.collection('leads').doc(leadNumber);
  const bucket = (duration: number) => Math.floor(now.getTime() / duration);
  const windows = [
    { key: `ip:${ip.replace(/^::ffff:/, '')}:${bucket(15 * 60_000)}`, limit: LEAD_LIMITS.ip },
    { key: `phone:${input.phone.replace(/^\+/, '')}:${bucket(60 * 60_000)}`, limit: LEAD_LIMITS.phone },
    { key: `global:${bucket(10 * 60_000)}`, limit: LEAD_LIMITS.global },
  ].map(item => ({ ...item, ref: db.collection('_leadRateLimits').doc(hash(item.key)) }));
  return db.runTransaction(async transaction => {
    const previous = await transaction.get(receiptRef);
    if (previous.exists) {
      const saved = previous.data()!;
      if (saved.requestHash !== requestHash) throw new HttpsError('failed-precondition', 'מזהה הפנייה כבר שימש לפרטים אחרים.');
      return { leadNumber: saved.leadNumber as string };
    }
    const counters = await transaction.getAll(...windows.map(window => window.ref));
    if (counters.some((counter, index) => (counter.data()?.count ?? 0) >= windows[index].limit)) throw new HttpsError('resource-exhausted', 'נשלחו פניות רבות מדי. נסי שוב מאוחר יותר.');
    transaction.create(leadRef, { ...details, leadNumber, schemaVersion: 1, status: 'new', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    transaction.create(receiptRef, { requestHash, leadNumber, createdAt: FieldValue.serverTimestamp() });
    windows.forEach((window, index) => transaction.set(window.ref, { count: (counters[index].data()?.count ?? 0) + 1, expiresAt: Timestamp.fromMillis(now.getTime() + 24 * 60 * 60_000) }));
    return { leadNumber };
  });
}
