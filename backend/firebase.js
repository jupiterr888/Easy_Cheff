import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants';

console.log('[Firebase] Initializing Firebase configuration...');

// Get Firebase config from app.json extra or environment variables
const getFirebaseConfig = () => {
  const extra = Constants.expoConfig?.extra || {};
  
  return {
    apiKey: extra.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAogS3Ayu0zTYM9rEHHGfCFLNaU372PXII',
    authDomain: extra.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'easych-11cd3.firebaseapp.com',
    projectId: extra.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'easych-11cd3',
    storageBucket: extra.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'easych-11cd3.firebasestorage.app',
    messagingSenderId: extra.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '110366611602',
    appId: extra.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:110366611602:web:f90665f4eebbe4832d6e4b'
  };
};

const firebase = getFirebaseConfig();

console.log('[Firebase] Config values:', {
  apiKey: firebase.apiKey ? 'SET' : 'MISSING',
  authDomain: firebase.authDomain ? 'SET' : 'MISSING',
  projectId: firebase.projectId ? 'SET' : 'MISSING',
  storageBucket: firebase.storageBucket ? 'SET' : 'MISSING',
  messagingSenderId: firebase.messagingSenderId ? 'SET' : 'MISSING',
  appId: firebase.appId ? 'SET' : 'MISSING',
});

// verifica daca toate valorile sunt setate
const requiredFields = [
  'apiKey',
  'authDomain', 
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId'
];

const missingFields = requiredFields.filter(field => !firebase[field]);
if (missingFields.length > 0) {
  console.error('[Firebase] Missing required Firebase fields:', missingFields);
  throw new Error(`Missing required Firebase configuration: ${missingFields.join(', ')}`);
}

// initializeaza firebase
let auth;
let db;
let storage;

try {
  console.log('[Firebase] Initializing app...');
  const app = initializeApp(firebase);
  console.log('[Firebase] App initialized successfully');

  // initializeaza Auth cu React Native persistence
  console.log('[Firebase] Initializing auth...');
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
  console.log('[Firebase] Auth initialized successfully');

  // initializeaza firestore
  console.log('[Firebase] Initializing Firestore...');
  db = getFirestore(app);
  console.log('[Firebase] Firestore initialized successfully');

  // initializeaza Storage
  console.log('[Firebase] Initializing Storage...');
  storage = getStorage(app);
  console.log('[Firebase] Storage initialized successfully');
} catch (error) {
  console.error('[Firebase] Initialization error:', error);
  throw error;
}

export { auth, db, storage };
