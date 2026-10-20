import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, getIdTokenResult, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { connectFirestoreEmulator, doc, getFirestore, serverTimestamp, setDoc, terminate } from 'firebase/firestore';

test('real emulator sign-in, claim enforcement, refresh, and sign-out', { timeout: 30000 }, async () => {
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:9099');
  const app = initializeApp({ apiKey: 'demo-api-key', projectId: 'demo-royal-icing' }, 'auth-integration-test');
  const auth = getAuth(app);
  const db = getFirestore(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const email = `emulator-${Date.now()}@example.test`;
  const password = 'test-only-password';
  const record = doc(db, 'products/auth-integration');
  const data = () => ({ name: 'Emulator test only', description: '', price: 120, isActive: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    assert.notEqual((await getIdTokenResult(user)).claims.admin, true);
    await assert.rejects(setDoc(record, data()), error => error.code === 'permission-denied');
    // Trusted emulator-only administration; this code is never part of the web app.
    const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-api-key', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({ localId: user.uid, customAttributes: JSON.stringify({ admin: true }) }),
    });
    assert.equal(response.ok, true, await response.text());
    assert.equal((await getIdTokenResult(user, true)).claims.admin, true);
    await setDoc(record, data());
    await signOut(auth);
    await assert.rejects(setDoc(record, data()), error => error.code === 'permission-denied');
    await assert.rejects(signInWithEmailAndPassword(auth, email, 'wrong-password'));
    const signedIn = await signInWithEmailAndPassword(auth, email, password);
    assert.equal((await getIdTokenResult(signedIn.user)).claims.admin, true);
  } finally { await signOut(auth); await terminate(db); await deleteApp(app); }
});
