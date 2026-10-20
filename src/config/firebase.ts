/**
 * Firebase Configuration
 * זה הקובץ שבו אנו משתמשים לתצורת Firebase בפרויקט
 */

import { getApps, initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectStorageEmulator, getStorage } from 'firebase/storage'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

// 🔑 החלף את הערכים האלה בערכים שלך מ-Firebase Console
// https://console.firebase.google.com → Project Settings → Web App Config

const useEmulators = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
const firebaseConfig = useEmulators ? {
  apiKey: 'demo-api-key', authDomain: 'demo-royal-icing.firebaseapp.com',
  projectId: 'demo-royal-icing', storageBucket: 'demo-royal-icing.appspot.com',
  appId: 'demo-royal-icing',
} : {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// בדוק אם כל הערכים קיימים
export const isFirebaseConfigured = [firebaseConfig.apiKey, firebaseConfig.projectId, firebaseConfig.authDomain]
  .every(value => typeof value === 'string' && value.trim().length > 0 && !value.startsWith('YOUR_'));

// Initialize Firebase
const existingApp = getApps().find(candidate => candidate.name === '[DEFAULT]');
const app = isFirebaseConfigured ? existingApp ?? initializeApp(firebaseConfig) : null

// Initialize Firebase services
export const db = app ? getFirestore(app) : null
export const auth = app ? getAuth(app) : null
export const storage = app ? getStorage(app) : null
export const functions = app ? getFunctions(app, import.meta.env.VITE_ORDER_FUNCTION_REGION || 'europe-west1') : null;
const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY;
export const isOrderServiceReady = Boolean(app && (useEmulators || (appCheckSiteKey && !appCheckSiteKey.startsWith('YOUR_'))));
// Both public callable endpoints require the same App Check configuration.
export const isLeadServiceReady = isOrderServiceReady;
if (app && !existingApp && !useEmulators && appCheckSiteKey && !appCheckSiteKey.startsWith('YOUR_')) {
  initializeAppCheck(app, { provider: new ReCaptchaV3Provider(appCheckSiteKey), isTokenAutoRefreshEnabled: true });
}
if (storage) {
  storage.maxOperationRetryTime = 15000;
  storage.maxUploadRetryTime = 15000;
}

if (useEmulators && !existingApp && auth && db && storage) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  if (functions) connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}

export default app
