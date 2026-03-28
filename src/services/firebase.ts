import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  connectAuthEmulator,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import {
  getStorage,
  FirebaseStorage,
  connectStorageEmulator,
} from 'firebase/storage';
import {
  getMessaging,
  Messaging,
} from 'firebase/messaging';

// Firebase configuration from .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn('Firebase config incomplete. Check your .env.local file.');
}

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Firebase Services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export let messaging: Messaging | null = null;

// Initialize Messaging only if supported
try {
  messaging = getMessaging(app);
} catch (error) {
  console.log('Firebase Messaging not supported in this environment');
}

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Development: Use emulators if enabled
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('✓ Firebase emulators connected');
  } catch (error) {
    console.log('Firebase emulators already connected or error occurred');
  }
}

export default app;
