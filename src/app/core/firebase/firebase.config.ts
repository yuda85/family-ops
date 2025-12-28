import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  Firestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import { environment } from '../../../environments/environment';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

/**
 * Initialize Firebase app and services
 * Should be called once during app bootstrap
 */
export function initializeFirebase(): { app: FirebaseApp; db: Firestore; auth: Auth } {
  if (app && db && auth) {
    return { app, db, auth };
  }

  // Initialize Firebase app
  app = initializeApp(environment.firebase);

  // Initialize Firestore with persistence
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });

  // Initialize Auth
  auth = getAuth(app);

  // Set auth persistence to local storage
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Error setting auth persistence:', error);
  });

  return { app, db, auth };
}

/**
 * Get the Firebase app instance
 */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return app;
}

/**
 * Get the Firestore instance
 */
export function getFirestoreDb(): Firestore {
  if (!db) {
    throw new Error('Firestore not initialized. Call initializeFirebase() first.');
  }
  return db;
}

/**
 * Get the Auth instance
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    throw new Error('Auth not initialized. Call initializeFirebase() first.');
  }
  return auth;
}
