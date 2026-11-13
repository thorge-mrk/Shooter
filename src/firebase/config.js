import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyA4AVla69BMqDtiUI6zDTjSbjPN1iCNTdo',
  authDomain: 'project-coldbore.firebaseapp.com',
  databaseURL: 'https://project-coldbore-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'project-coldbore',
  storageBucket: 'project-coldbore.firebasestorage.app',
  messagingSenderId: '570139998565',
  appId: '1:570139998565:web:6866fffea308dd41e9898c'
};

function readEnvConfig() {
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
  if (!env.VITE_FIREBASE_API_KEY || !env.VITE_FIREBASE_DATABASE_URL) {
    return null;
  }
  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: env.VITE_FIREBASE_DATABASE_URL,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
  };
}

export function getFirebaseConfig() {
  return readEnvConfig() || DEFAULT_FIREBASE_CONFIG;
}

export function isFirebaseConfigured() {
  return Boolean(getFirebaseConfig());
}

let cachedServices = null;

export async function initFirebase() {
  const config = getFirebaseConfig();
  if (!config) {
    cachedServices = null;
    return null;
  }
  if (cachedServices) {
    return cachedServices;
  }

  for (const app of getApps()) {
    await deleteApp(app);
  }

  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getDatabase(app);
  cachedServices = { app, auth, db, config };
  return cachedServices;
}
