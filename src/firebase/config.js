import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const STORAGE_KEY = 'apex_armor_fb_config';

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

export function getSavedFirebaseConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.apiKey && parsed.databaseURL) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export function getFirebaseConfig() {
  return getSavedFirebaseConfig() || readEnvConfig();
}

export function isFirebaseConfigured() {
  return Boolean(getFirebaseConfig());
}

export function saveCustomFirebaseConfig(rawText) {
  // Accept either strict JSON or JS object snippet pasted from Firebase console
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const jsonified = rawText
      .replace(/const\s+\w+\s*=\s*/, '')
      .replace(/;\s*$/, '')
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
      .replace(/'/g, '"');
    parsed = JSON.parse(jsonified);
  }

  if (!parsed || !parsed.apiKey || !parsed.authDomain || !parsed.databaseURL || !parsed.projectId) {
    throw new Error('Config must include apiKey, authDomain, databaseURL, and projectId.');
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  return parsed;
}

export function clearCustomFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY);
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

export async function reinitFirebase() {
  cachedServices = null;
  return initFirebase();
}
