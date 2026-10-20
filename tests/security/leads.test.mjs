import { strict as assert } from 'node:assert';
import { randomUUID, createHmac } from 'node:crypto';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, getIdTokenResult } from 'firebase/auth';
import { collection, connectFirestoreEmulator, doc, getDocs, getFirestore, serverTimestamp, setDoc, terminate, updateDoc, deleteDoc } from 'firebase/firestore';
import { createLeadRepository } from '../../src/api/leads/repository.ts';

const requireServer = createRequire(new URL('../../functions/package.json', import.meta.url));
const { initializeApp: initializeAdmin, deleteApp: deleteAdmin } = requireServer('firebase-admin/app');
const { getFirestore: getAdminDb } = requireServer('firebase-admin/firestore');
const url = 'http://127.0.0.1:5001/demo-royal-icing/europe-west1/submitLead';
test('guest contact submission persists once, appears in management, updates across clients and limits abuse', { timeout: 120000 }, async () => {
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080');
  const id = `leads-${randomUUID()}`;
  const server = initializeAdmin({ projectId: 'demo-royal-icing' }, id);
  const serverDb = getAdminDb(server);
  const apps = [0, 1, 2, 3].map(index => initializeApp({ projectId: 'demo-royal-icing', apiKey: 'demo-api-key' }, `${id}-${index}`));
  const databases = apps.map(app => { const db = getFirestore(app); connectFirestoreEmulator(db, '127.0.0.1', 8080); return db; });
  const repositories = databases.map(createLeadRepository);
  const draft = { idempotencyKey: randomUUID(), name: 'פנייה מקומית לבדיקה', phone: '0501234567', email: `${id}@example.test`, message: 'שאלה כללית\nללא פרטי הזמנה' };
  async function call(input) {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: input }), signal: AbortSignal.timeout(45000) });
    return { status: response.status, body: await response.json() };
  }
  try {
    for (const patch of [{ name: '' }, { phone: 501234567 }, { email: 'invalid' }, { message: 'x'.repeat(4001) }, { status: 'completed' }, { productId: 'x' }, { createdAt: 'fake' }, { internalNotes: 'fake' }]) {
      assert.equal((await call({ ...draft, ...patch })).body.error?.status, 'INVALID_ARGUMENT');
    }
    const replies = await Promise.all([call(draft), call(draft), call(draft)]);
    replies.forEach(reply => assert.equal(reply.status, 200, JSON.stringify(reply.body)));
    const receipt = replies[0].body.result;
    assert.match(receipt.leadNumber, /^CF-[A-F0-9]{20}$/); assert.deepEqual(Object.keys(receipt), ['leadNumber']);
    replies.forEach(reply => assert.deepEqual(reply.body.result, receipt));
    const created = await serverDb.collection('leads').where('email', '==', draft.email).get();
    assert.equal(created.size, 1);
    const saved = created.docs[0].data();
    assert.equal(saved.status, 'new'); assert.equal(saved.phone, '+972501234567'); assert.equal(saved.message, draft.message);
    assert.equal(saved.schemaVersion, 1); assert.ok(saved.createdAt.toDate() instanceof Date); assert.ok(saved.updatedAt.toDate() instanceof Date);
    for (const key of ['idempotencyKey', 'productId', 'quantity', 'quotedPrice', 'ip', 'requestHash']) assert.equal(saved[key], undefined);
    assert.equal((await call({ ...draft, message: 'שונה' })).body.error.status, 'FAILED_PRECONDITION');
    const target = doc(databases[2], 'leads', receipt.leadNumber);
    await assert.rejects(repositories[2].list(), error => error.code === 'permission-denied');
    await assert.rejects(setDoc(doc(databases[2], 'leads', `${id}-forged`), { name: 'fake' }), error => error.code === 'permission-denied');
    await assert.rejects(updateDoc(target, { status: 'completed', updatedAt: serverTimestamp() }), error => error.code === 'permission-denied');
    for (const name of ['_leadRequests', '_leadRateLimits']) await assert.rejects(getDocs(collection(databases[2], name)), error => error.code === 'permission-denied');

    for (const [index, app] of apps.entries()) {
      if (index === 2) continue;
      const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      const { user } = await createUserWithEmailAndPassword(auth, `${id}-${index}@example.test`, 'emulator-only-password');
      if (index !== 3) {
        const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-api-key', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' }, body: JSON.stringify({ localId: user.uid, customAttributes: JSON.stringify({ admin: true }) }) });
        assert.equal(response.ok, true); await getIdTokenResult(user, true);
      }
    }
    const entry = (await repositories[0].list()).leads.find(item => item.lead.leadNumber === receipt.leadNumber);
    assert.ok(entry, 'the submitted contact is visible in management');
    await repositories[0].updateStatus(entry, 'contacted');
    const fresh = (await repositories[1].list()).leads.find(item => item.lead.id === entry.lead.id);
    assert.equal(fresh.lead.status, 'contacted'); assert.equal(fresh.lead.message, draft.message);
    assert.equal(fresh.lead.createdAt.getTime(), entry.lead.createdAt.getTime());
    await assert.rejects(repositories[1].updateStatus(entry, 'completed'), /השתנתה/);
    await repositories[1].updateStatus(fresh, 'completed');
    assert.equal((await repositories[0].list()).leads.find(item => item.lead.id === entry.lead.id).lead.status, 'completed');
    const adminTarget = doc(databases[0], 'leads', entry.lead.id);
    for (const patch of [{ message: 'overwrite' }, { name: 'overwrite' }, { email: 'fake@example.test' }, { phone: '123' }, { status: 'invalid' }]) await assert.rejects(updateDoc(adminTarget, { ...patch, updatedAt: serverTimestamp() }), error => error.code === 'permission-denied');
    await assert.rejects(deleteDoc(adminTarget), error => error.code === 'permission-denied');
    await assert.rejects(repositories[3].list(), error => error.code === 'permission-denied');
    await assert.rejects(repositories[3].updateStatus(fresh, 'new'), error => error.code === 'permission-denied');

    for (const phone of ['+972 50 1234567', '00972 50 1234567']) assert.equal((await call({ ...draft, phone, idempotencyKey: randomUUID() })).status, 200);
    assert.equal((await call({ ...draft, idempotencyKey: randomUUID() })).body.error.status, 'RESOURCE_EXHAUSTED');
    for (const phone of ['0502222222', '0503333333']) assert.equal((await call({ ...draft, phone, idempotencyKey: randomUUID() })).status, 200);
    assert.equal((await call({ ...draft, phone: '0504444444', idempotencyKey: randomUUID() })).body.error.status, 'RESOURCE_EXHAUSTED');
    assert.deepEqual((await call(draft)).body.result, receipt, 'idempotent retry works even after quota exhaustion and status changes');
    assert.equal((await serverDb.collection('leads').where('email', '==', draft.email).get()).size, 5);
    const controls = await serverDb.collection('_leadRateLimits').get();
    controls.docs.forEach(item => { assert.match(item.id, /^[a-f0-9]{64}$/); assert.deepEqual(Object.keys(item.data()).sort(), ['count', 'expiresAt']); });
  } finally {
    await Promise.all(databases.map(terminate)); await Promise.all(apps.map(deleteApp)); await serverDb.terminate(); await deleteAdmin(server);
  }
});

test('the global contact quota admits only one concurrent request at the remaining slot', { timeout: 45000 }, async () => {
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080');
  const { createLead } = await import('../../functions/lib/lead-service.js');
  const id = `lead-global-${randomUUID()}`;
  const server = initializeAdmin({ projectId: 'demo-royal-icing' }, id);
  const db = getAdminDb(server);
  const secret = `emulator-only-${randomUUID()}`;
  const now = new Date('2030-01-01T12:00:00Z');
  const key = createHmac('sha256', secret).update(`global:${Math.floor(now.getTime() / (10 * 60000))}`).digest('hex');
  const counter = db.collection('_leadRateLimits').doc(key);
  const requests = ['0505555555', '0506666666'].map(phone => ({ idempotencyKey: randomUUID(), name: 'בדיקת מגבלה מקומית', phone, email: `${id}@example.test`, message: 'בדיקת מכסה משותפת' }));
  try {
    await counter.set({ count: 99 });
    const results = await Promise.allSettled(requests.map((input, index) => createLead(db, input, `emulator-test-ip-${index}`, secret, now)));
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(results.filter(result => result.status === 'rejected' && result.reason.code === 'resource-exhausted').length, 1);
    assert.equal((await counter.get()).data().count, 100);
    const accepted = results.findIndex(result => result.status === 'fulfilled');
    assert.deepEqual(await createLead(db, requests[accepted], `emulator-test-ip-${accepted}`, secret, now), results[accepted].value);
    assert.equal((await db.collection('leads').where('email', '==', `${id}@example.test`).get()).size, 1);
  } finally { await db.terminate(); await deleteAdmin(server); }
});
