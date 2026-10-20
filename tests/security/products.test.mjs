import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, getIdTokenResult, signOut } from 'firebase/auth';
import { connectFirestoreEmulator, disableNetwork, enableNetwork, getFirestore, terminate } from 'firebase/firestore';
import { connectStorageEmulator, getBytes, getStorage, ref } from 'firebase/storage';
import { createProductRepository } from '../../src/api/catalog/repository.ts';
import { importMigration, parseLocalProducts, previewMigration } from '../../src/api/catalog/migration.ts';

test('products persist across independent clients; retries, visibility, images, and migration are safe', { timeout: 60000 }, async () => {
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080');
  const config = { apiKey: 'demo-api-key', projectId: 'demo-royal-icing', storageBucket: 'demo-royal-icing.appspot.com' };
  const adminApp = initializeApp(config, 'stage2-admin');
  const publicApp = initializeApp(config, 'stage2-reader');
  const auth = getAuth(adminApp);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const adminDb = getFirestore(adminApp), publicDb = getFirestore(publicApp);
  connectFirestoreEmulator(adminDb, '127.0.0.1', 8080); connectFirestoreEmulator(publicDb, '127.0.0.1', 8080);
  const storage = getStorage(adminApp); connectStorageEmulator(storage, '127.0.0.1', 9199);
  const admin = createProductRepository(adminDb, storage);
  const reader = createProductRepository(publicDb, null);
  const id = `stage2-${Date.now()}`;
  const draft = { name: 'מוצר לבדיקה מקומית בלבד', description: 'תיאור', price: 120, category: 'קטגוריה קיימת', image: '/images/home/floral-set.webp', isActive: true };
  try {
    const { user } = await createUserWithEmailAndPassword(auth, `${id}@example.test`, 'emulator-only-password');
    const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-api-key', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({ localId: user.uid, customAttributes: JSON.stringify({ admin: true }) }),
    });
    assert.equal(response.ok, true, await response.text()); await getIdTokenResult(user, true);
    assert.equal(await admin.save(id, draft, 'create'), true);
    assert.equal(await admin.save(id, draft, 'create'), false, 'retry must not duplicate an acknowledged write');
    let fromAnotherClient = await reader.get(id);
    assert.equal(fromAnotherClient.id, id); assert.equal(fromAnotherClient.category, draft.category);
    assert.ok(fromAnotherClient.createdAt instanceof Date);
    const createdAt = fromAnotherClient.createdAt.getTime();
    assert.ok((await reader.list()).some(item => item.id === id));
    await admin.save(id, { ...draft, name: 'עודכן', isActive: false }, 'update');
    assert.equal((await admin.get(id)).createdAt.getTime(), createdAt);
    assert.equal((await reader.list()).some(item => item.id === id), false);
    await assert.rejects(reader.get(id), error => error.code === 'permission-denied');
    assert.ok((await admin.list(true)).some(item => item.id === id));
    await admin.save(id, draft, 'update');
    await assert.rejects(reader.save(id, { ...draft, price: 1 }, 'update'), error => error.code === 'permission-denied');

    const dataImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRz0AAAAASUVORK5CYII=';
    const raw = JSON.stringify([
      { ...draft, id, name: 'must not overwrite existing' },
      { ...draft, id: `${id}-import`, image: dataImage, createdAt: '2026-01-01T10:00:00.000Z' },
    ]);
    const preview = await previewMigration(admin, raw);
    assert.deepEqual(preview.map(row => row.state), ['existing', 'new']);
    const result = await importMigration(admin, preview, () => {});
    assert.deepEqual(result, { imported: 1, skipped: 1, failed: 0 });
    assert.equal((await admin.get(id)).name, draft.name);
    const imported = await reader.get(`${id}-import`);
    assert.equal(imported.createdAt.toISOString(), '2026-01-01T10:00:00.000Z');
    assert.ok(imported.image.startsWith('http://127.0.0.1:9199/'), 'only the emulator test uses HTTP Storage URLs');
    const bytes = await getBytes(ref(storage, imported.image));
    assert.deepEqual(Buffer.from(bytes), Buffer.from(dataImage.split(',')[1], 'base64'), 'uploaded image bytes remain unchanged');
    await admin.save(`${id}-shared`, { ...draft, image: dataImage }, 'create');
    assert.equal((await admin.get(`${id}-shared`)).image, imported.image, 'identical content reuses the immutable image');
    const repeated = await importMigration(admin, parseLocalProducts(raw), () => {});
    assert.deepEqual(repeated, { imported: 0, skipped: 2, failed: 0 });
    await admin.remove(`${id}-import`);
    assert.equal((await getBytes(ref(storage, imported.image))).byteLength, bytes.byteLength, 'deleting a product keeps shared image bytes');
    assert.ok(await reader.get(`${id}-shared`));

    await disableNetwork(adminDb);
    await assert.rejects(admin.save(`${id}-offline`, draft, 'create'));
    await assert.rejects(admin.remove(id));
    await enableNetwork(adminDb);
    assert.equal(await reader.get(`${id}-offline`), null);
    assert.equal((await reader.get(id)).name, draft.name);
    await admin.remove(id);
    assert.equal(await reader.get(id), null);
  } finally {
    await enableNetwork(adminDb); await signOut(auth);
    await Promise.all([terminate(adminDb), terminate(publicDb)]);
    await Promise.all([deleteApp(adminApp), deleteApp(publicApp)]);
  }
});
