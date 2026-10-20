import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { createOrder } from './order-service.js';
import { createLead } from './lead-service.js';

const emulator = process.env.FUNCTIONS_EMULATOR === 'true';
const hashKey = defineSecret('ORDER_HASH_KEY');
if (!getApps().length) initializeApp();
export const submitOrder = onCall({
  region: process.env.ORDER_FUNCTION_REGION || 'europe-west1',
  enforceAppCheck: !emulator,
  secrets: emulator ? [] : [hashKey],
  maxInstances: 3, concurrency: 20, timeoutSeconds: 30,
}, async request => {
  try {
    const secret = emulator ? 'local-demo-only-order-hash-key-not-for-production' : hashKey.value();
    const ip = request.rawRequest.ip || request.rawRequest.socket.remoteAddress || (emulator ? '127.0.0.1' : '');
    return await createOrder(getFirestore(), request.data, ip, secret);
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    // Do not log request data, customer details, tokens, IPs or raw server errors.
    throw new HttpsError('unavailable', 'לא ניתן לאשר את קליטת הבקשה כרגע. נסי שוב עם אותם פרטים.');
  }
});

export const submitLead = onCall({
  region: process.env.ORDER_FUNCTION_REGION || 'europe-west1',
  enforceAppCheck: !emulator,
  secrets: emulator ? [] : [hashKey],
  maxInstances: 3, concurrency: 20, timeoutSeconds: 30,
}, async request => {
  try {
    const secret = emulator ? 'local-demo-only-order-hash-key-not-for-production' : hashKey.value();
    const ip = request.rawRequest.ip || request.rawRequest.socket.remoteAddress || (emulator ? '127.0.0.1' : '');
    return await createLead(getFirestore(), request.data, ip, secret);
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('unavailable', 'לא ניתן לאשר את קליטת הפנייה כרגע. נסי שוב עם אותם פרטים.');
  }
});
