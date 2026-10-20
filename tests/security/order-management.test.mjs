import { strict as assert } from 'node:assert';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, getIdTokenResult } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, terminate } from 'firebase/firestore';
import { createOrderRepository } from '../../src/api/orders/management.ts';
import { createNewOrder } from '../../functions/src/order-model.ts';

const requireServer = createRequire(new URL('../../functions/package.json', import.meta.url));
const { initializeApp: initializeAdmin, deleteApp: deleteAdmin } = requireServer('firebase-admin/app');
const { getFirestore: getAdminDb, FieldValue } = requireServer('firebase-admin/firestore');

test('order management persists narrow updates, detects conflicts and denies guests', { timeout: 60000 }, async () => {
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080');
  const id = `management-${Date.now()}`;
  const server = initializeAdmin({ projectId: 'demo-royal-icing' }, id);
  const seedDb = getAdminDb(server);
  const apps = [0, 1, 2].map(index => initializeApp({ projectId: 'demo-royal-icing', apiKey: 'demo-api-key' }, `${id}-${index}`));
  const databases = apps.map(app => { const db = getFirestore(app); connectFirestoreEmulator(db, '127.0.0.1', 8080); return db; });
  const repositories = databases.map(createOrderRepository);
  try {
    const users = [];
    for (const [index, app] of apps.slice(0, 2).entries()) {
      const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      const { user } = await createUserWithEmailAndPassword(auth, `${id}-${index}@example.test`, 'emulator-password');
      const result = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-api-key', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' }, body: JSON.stringify({ localId: user.uid, customAttributes: JSON.stringify({ admin: true }) }) });
      assert.equal(result.ok, true); await getIdTokenResult(user, true); users.push(user);
    }
    const request = { productId: 'test-product', customerName: 'בדיקה מקומית', customerPhone: '+972501234567', customerEmail: '', quantity: 10, requestedPickupDate: '2026-12-31', customizationNotes: 'מקורי', requestedText: 'מזל טוב', preferredColors: 'ורוד' };
    await seedDb.doc(`orders/${id}`).set(createNewOrder(request, { name: 'מוצר מקורי', category: '', image: '' }, id, FieldValue.serverTimestamp()));
    await seedDb.doc(`orders/${id}-invalid`).set({ status: 'new' });
    const initial = await repositories[0].list();
    assert.ok(initial.invalidCount >= 1, 'malformed documents are reported');
    const entry = initial.orders.find(item => item.order.id === id); assert.ok(entry);
    const input = { status: 'confirmed', quotedPrice: 200, internalNotes: 'הערה פנימית', priceConfirmation: { action: 'confirm', price: 180 } };
    await repositories[0].update(entry, input, users[0].uid);
    const fresh = (await repositories[1].list()).orders.find(item => item.order.id === id);
    assert.equal(fresh.order.confirmedPrice, 180); assert.equal(fresh.order.quotedPrice, 200);
    assert.equal(fresh.order.priceConfirmedBy, users[0].uid); assert.ok(fresh.order.priceConfirmedAt instanceof Date);
    assert.equal(fresh.order.internalNotes, input.internalNotes); assert.equal(fresh.order.customerPhone, request.customerPhone);
    assert.equal(fresh.order.customizationNotes, request.customizationNotes); assert.equal(fresh.order.createdAt.getTime(), entry.order.createdAt.getTime());
    await assert.rejects(repositories[1].update(entry, { ...input, internalNotes: 'stale' }, users[1].uid), /השתנתה/);
    await repositories[1].update(fresh, { ...input, status: 'ready', quotedPrice: 250, priceConfirmation: { action: 'keep' } }, users[1].uid);
    const kept = (await repositories[0].list()).orders.find(item => item.order.id === id);
    assert.equal(kept.order.confirmedPrice, 180); assert.equal(kept.order.priceConfirmedBy, users[0].uid);
    await repositories[0].update(kept, { ...input, priceConfirmation: { action: 'clear' } }, users[0].uid);
    const cleared = (await repositories[1].list()).orders.find(item => item.order.id === id);
    assert.equal(cleared.order.confirmedPrice, null); assert.equal(cleared.order.priceConfirmedAt, null);
    await assert.rejects(repositories[2].list(), error => error.code === 'permission-denied');
    await assert.rejects(repositories[2].update(cleared, input, users[0].uid), error => error.code === 'permission-denied');
  } finally {
    await seedDb.doc(`orders/${id}`).delete(); await seedDb.doc(`orders/${id}-invalid`).delete();
    await Promise.all(databases.map(terminate)); await Promise.all(apps.map(deleteApp)); await deleteAdmin(server);
  }
});
