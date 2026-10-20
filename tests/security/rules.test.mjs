import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage';

let env;
const product = { name: 'Test product', description: '', price: 120, isActive: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-royal-icing',
    firestore: { host: '127.0.0.1', port: 8080, rules: await readFile('firestore.rules', 'utf8') },
    storage: { host: '127.0.0.1', port: 9199, rules: await readFile('storage.rules', 'utf8') },
  });
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'products/active'), product);
    await setDoc(doc(db, 'products/hidden'), { ...product, isActive: false });
    await setDoc(doc(db, 'products/legacy'), { name: 'Legacy without active flag', description: '', price: 120, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    await setDoc(doc(db, 'orders/private'), { customerName: 'Test only', status: 'new', quantity: 10, quotedPrice: null, internalNotes: '' });
    await setDoc(doc(db, 'leads/private'), { name: 'Test only', status: 'new' });
  });
});
after(async () => { if (env) await env.cleanup(); });
const dbFor = role => role === 'guest' ? env.unauthenticatedContext().firestore() : env.authenticatedContext(role, role === 'admin' ? { admin: true } : {}).firestore();

test('public can read only active products and must constrain list queries', async () => {
  const db = dbFor('guest');
  await assertSucceeds(getDoc(doc(db, 'products/active')));
  await assertSucceeds(getDoc(doc(db, 'products/nonexistent')));
  await assertSucceeds(getDocs(query(collection(db, 'products'), where('isActive', '==', true))));
  await assertFails(getDoc(doc(db, 'products/hidden')));
  await assertFails(getDoc(doc(db, 'products/legacy')));
  await assertFails(getDocs(collection(db, 'products')));
  await assertSucceeds(getDoc(doc(dbFor('ordinary'), 'products/active')));
});
for (const role of ['guest', 'ordinary']) {
  test(`${role} cannot read private data, create requests, or mutate admin data`, async () => {
    const db = dbFor(role);
    for (const name of ['orders', 'leads']) {
      await assertFails(getDoc(doc(db, name, 'private')));
      await assertFails(getDocs(collection(db, name)));
      await assertFails(setDoc(doc(db, name, `attack-${role}`), { status: 'new' }));
      await assertFails(updateDoc(doc(db, name, 'private'), { status: 'completed', updatedAt: serverTimestamp() }));
      await assertFails(deleteDoc(doc(db, name, 'private')));
    }
    await assertFails(setDoc(doc(db, 'products', `attack-${role}`), product));
    await assertFails(updateDoc(doc(db, 'products/active'), { price: 0 }));
    await assertFails(updateDoc(doc(db, 'orders/private'), { quotedPrice: 0, updatedAt: serverTimestamp() }));
    await assertFails(deleteDoc(doc(db, 'products/active')));
    await assertFails(setDoc(doc(db, 'admins', role), { admin: true }));
  });
}
test('only boolean claim grants admin access', async () => {
  const db = env.authenticatedContext('forged-role', { admin: 'true' }).firestore();
  await assertFails(getDoc(doc(db, 'orders/private')));
});
test('admin can manage products and private records with validated updates', async () => {
  const db = dbFor('admin');
  await assertSucceeds(getDocs(collection(db, 'products')));
  await assertSucceeds(setDoc(doc(db, 'products/new'), product));
  await assertSucceeds(updateDoc(doc(db, 'products/new'), { isActive: false, updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(db, 'products/new'), { price: -1, updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(db, 'products/new'), { description: 'changed without server timestamp' }));
  await assertSucceeds(deleteDoc(doc(db, 'products/new')));
  await assertSucceeds(getDoc(doc(db, 'orders/private')));
  await assertSucceeds(getDoc(doc(db, 'leads/private')));
  await assertSucceeds(updateDoc(doc(db, 'orders/private'), { status: 'pending_confirmation', quotedPrice: 140, updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(db, 'orders/private'), { quantity: 1, updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(db, 'orders/private'), { quotedPrice: -1, updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(db, 'orders/private'), { status: 'invented', updatedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(doc(db, 'leads/private'), { status: 'contacted', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(db, 'leads/private'), { name: 'overwritten', updatedAt: serverTimestamp() }));
  await assertFails(setDoc(doc(db, 'orders/direct-admin-create'), { status: 'new' }));
  await assertFails(getDoc(doc(db, 'unknown/private')));
});
test('public and ordinary users cannot upload; admin uploads are bounded and immutable', async () => {
  const admin = env.authenticatedContext('storage-admin', { admin: true }).storage();
  const guest = env.unauthenticatedContext().storage();
  const user = env.authenticatedContext('ordinary').storage();
  const bytes = new Uint8Array([137, 80, 78, 71]);
  const options = { contentType: 'image/png' };
  await assertFails(uploadBytes(ref(guest, 'products/guest.png'), bytes, options));
  await assertFails(uploadBytes(ref(user, 'products/user.png'), bytes, options));
  await assertSucceeds(uploadBytes(ref(admin, 'products/valid.png'), bytes, options));
  await assertSucceeds(getBytes(ref(guest, 'products/valid.png')));
  await assertFails(uploadBytes(ref(admin, 'products/valid.png'), new Uint8Array([1, 2, 3]), options));
  await assertFails(deleteObject(ref(admin, 'products/valid.png')));
  await assertFails(uploadBytes(ref(admin, 'products/script.svg'), bytes, { contentType: 'image/svg+xml' }));
  await assertFails(uploadBytes(ref(admin, 'products/huge.png'), new Uint8Array(5 * 1024 * 1024 + 1), options));
  await assertFails(uploadBytes(ref(admin, 'private/file.png'), bytes, options));
});
