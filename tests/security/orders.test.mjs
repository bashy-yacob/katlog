import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, getIdTokenResult } from 'firebase/auth';
import { createOrderRepository } from '../../src/api/orders/management.ts';
import { collection, connectFirestoreEmulator, doc, getDoc, getDocs, getFirestore, terminate } from 'firebase/firestore';

const requireServer = createRequire(new URL('../../functions/package.json', import.meta.url));
const { initializeApp: initializeAdmin, deleteApp: deleteAdmin } = requireServer('firebase-admin/app');
const { getFirestore: getAdminDb, FieldValue } = requireServer('firebase-admin/firestore');
const url = 'http://127.0.0.1:5001/demo-royal-icing/europe-west1/submitOrder';

test('public callable validates, saves once atomically, limits abuse and returns only a private-safe receipt', { timeout: 120000 }, async () => {
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080');
  const adminApp = initializeAdmin({ projectId: 'demo-royal-icing' }, 'orders-server-test');
  const db = getAdminDb(adminApp);
  const publicApp = initializeApp({ projectId: 'demo-royal-icing', apiKey: 'demo-api-key' }, 'orders-public-reader');
  const publicDb = getFirestore(publicApp); connectFirestoreEmulator(publicDb, '127.0.0.1', 8080);
  const managerApp = initializeApp({ projectId: 'demo-royal-icing', apiKey: 'demo-api-key' }, 'orders-manager-reader');
  const managerDb = getFirestore(managerApp); connectFirestoreEmulator(managerDb, '127.0.0.1', 8080);
  const productId = `orders-test-${randomUUID()}`;
  const product = db.collection('products').doc(productId);
  const future = new Date(); future.setUTCDate(future.getUTCDate() + 2);
  const draft = { idempotencyKey: randomUUID(), productId, customerName: 'לקוחה לבדיקה מקומית בלבד', customerPhone: '0501234567', customerEmail: '', quantity: 10, requestedPickupDate: future.toISOString().slice(0, 10), customizationNotes: 'הערות לבדיקה', requestedText: 'מזל טוב', preferredColors: 'ורוד' };
  async function call(input) {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: input }), signal: AbortSignal.timeout(45000) });
    const body = await response.json();
    return { status: response.status, body };
  }
  try {
    await product.set({ name: 'שם מוצר מהשרת', description: '', price: 120, image: '/images/home/floral-set.webp', category: 'עוגיות', isActive: true, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    for (const patch of [{ quantity: 9 }, { quantity: '10' }, { requestedPickupDate: '2020-01-01' }, { requestedPickupDate: '2026-02-30' }, { price: 1 }, { quotedPrice: 0 }, { status: 'confirmed' }, { shippingAddress: 'forbidden' }, { requestedText: 'x'.repeat(251) }]) {
      const response = await call({ ...draft, ...patch });
      assert.equal(response.body.error?.status, 'INVALID_ARGUMENT', JSON.stringify(response.body));
    }
    const replies = await Promise.all([call(draft), call(draft), call(draft)]);
    replies.forEach(reply => assert.equal(reply.status, 200, JSON.stringify(reply.body)));
    const number = replies[0].body.result.orderNumber;
    assert.match(number, /^RI-[A-F0-9]{20}$/);
    assert.deepEqual(replies.map(reply => reply.body.result), [{ orderNumber: number }, { orderNumber: number }, { orderNumber: number }]);
    assert.deepEqual(Object.keys(replies[0].body.result), ['orderNumber']);
    let orders = await db.collection('orders').where('productId', '==', productId).get();
    assert.equal(orders.size, 1);
    const saved = orders.docs[0].data();
    assert.equal(saved.productSnapshot.name, 'שם מוצר מהשרת');
    assert.equal(saved.quantity, 10); assert.equal(saved.status, 'new'); assert.equal(saved.quotedPrice, null);
    assert.equal(saved.confirmedPrice, null); assert.equal(saved.priceConfirmedAt, null); assert.equal(saved.priceConfirmedBy, null);
    assert.equal(saved.schemaVersion, 1); assert.equal(saved.currency, 'ILS');
    assert.equal(saved.fulfillmentMethod, 'pickup'); assert.ok(saved.createdAt.toDate() instanceof Date);
    assert.equal(saved.customerPhone, '+972501234567'); assert.equal(saved.idempotencyKey, undefined);
    assert.equal(saved.shippingAddress, undefined); assert.equal(saved.totalPrice, undefined);
    const managerAuth = getAuth(managerApp);
    connectAuthEmulator(managerAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
    const { user: manager } = await createUserWithEmailAndPassword(managerAuth, `${productId}@example.test`, 'emulator-only-password');
    const grant = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-api-key', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({ localId: manager.uid, customAttributes: JSON.stringify({ admin: true }) }),
    });
    assert.equal(grant.ok, true); await getIdTokenResult(manager, true);
    const management = createOrderRepository(managerDb);
    const received = (await management.list()).orders.find(item => item.order.orderNumber === number);
    assert.ok(received, 'the public submission appears in the management repository');
    await management.update(received, { status: 'in_progress', quotedPrice: 150, internalNotes: 'נקלטה לניהול', priceConfirmation: { action: 'keep' } }, manager.uid);
    const refreshed = (await management.list()).orders.find(item => item.order.orderNumber === number);
    assert.equal(refreshed.order.status, 'in_progress'); assert.equal(refreshed.order.quotedPrice, 150);
    assert.equal(refreshed.order.confirmedPrice, null); assert.equal(refreshed.order.internalNotes, 'נקלטה לניהול');
    assert.equal((await call({ ...draft, quantity: 11 })).body.error.status, 'FAILED_PRECONDITION');
    await assert.rejects(getDoc(doc(publicDb, 'orders', number)), error => error.code === 'permission-denied');
    await assert.rejects(getDocs(collection(publicDb, 'orders')), error => error.code === 'permission-denied');
    await assert.rejects(getDocs(collection(publicDb, '_orderRequests')), error => error.code === 'permission-denied');
    await assert.rejects(getDocs(collection(publicDb, '_orderRateLimits')), error => error.code === 'permission-denied');

    await product.update({ isActive: false });
    assert.equal((await call({ ...draft, idempotencyKey: randomUUID() })).body.error.status, 'NOT_FOUND');
    assert.equal((await call(draft)).body.result.orderNumber, number, 'a lost receipt remains recoverable after hiding the product');
    await product.update({ isActive: true });
    for (const customerPhone of ['+972 50 1234567', '00972 50 1234567']) assert.equal((await call({ ...draft, customerPhone, idempotencyKey: randomUUID() })).status, 200);
    assert.equal((await call({ ...draft, idempotencyKey: randomUUID() })).body.error.status, 'RESOURCE_EXHAUSTED', 'equivalent phone forms share a quota');
    for (const customerPhone of ['0502222222', '0503333333']) assert.equal((await call({ ...draft, customerPhone, idempotencyKey: randomUUID() })).status, 200);
    assert.equal((await call({ ...draft, customerPhone: '0504444444', idempotencyKey: randomUUID() })).body.error.status, 'RESOURCE_EXHAUSTED', 'IP quota stops new phone numbers too');
    assert.equal((await call(draft)).body.result.orderNumber, number, 'retries do not consume new-order quota');
    orders = await db.collection('orders').where('productId', '==', productId).get();
    assert.equal(orders.size, 5);
  } finally {
    await Promise.all([terminate(publicDb), terminate(managerDb)]);
    await Promise.all([deleteApp(publicApp), deleteApp(managerApp)]); await db.terminate(); await deleteAdmin(adminApp);
  }
});
