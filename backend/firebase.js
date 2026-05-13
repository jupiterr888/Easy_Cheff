import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

console.log('[Firebase] Initializing Firebase configuration...');

// configuratia - variabile de mediu pentru securitate
const firebase = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

console.log('[Firebase] Config values:', {
  apiKey: firebase.apiKey ? 'SET' : 'MISSING',
  authDomain: firebase.authDomain ? 'SET' : 'MISSING',
  projectId: firebase.projectId ? 'SET' : 'MISSING',
  storageBucket: firebase.storageBucket ? 'SET' : 'MISSING',
  messagingSenderId: firebase.messagingSenderId ? 'SET' : 'MISSING',
  appId: firebase.appId ? 'SET' : 'MISSING',
});

// verifica daca toate variabilele de mediu sunt setate
const requiredEnvVars = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', 
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('[Firebase] Missing required environment variables:', missingVars);
  throw new Error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
}

try {
  // initializeaza firebase
  console.log('[Firebase] Initializing app...');
  const app = initializeApp(firebase);
  console.log('[Firebase] App initialized successfully');

  // initializeaza Auth cu React Native persistence
  console.log('[Firebase] Initializing auth...');
  const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
  console.log('[Firebase] Auth initialized successfully');

  // initializeaza firestore
  console.log('[Firebase] Initializing Firestore...');
  const db = getFirestore(app);
  console.log('[Firebase] Firestore initialized successfully');

  // initializeaza Storage
  console.log('[Firebase] Initializing Storage...');
  const storage = getStorage(app);
  console.log('[Firebase] Storage initialized successfully');

  export { auth, db, storage };
} catch (error) {
  console.error('[Firebase] Initialization error:', error);
  throw error;
}
