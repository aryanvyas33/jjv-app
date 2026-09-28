import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig';

let app;
let db = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  // React Native Firestore initialization with long-polling fallback for mobile reliability
  try {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true
    });
  } catch (initErr) {
    // If already initialized, retrieve existing instance
    db = getFirestore(app);
  }
} catch (e) {
  console.warn('Firebase initialization warning:', e);
}

export {
  app,
  db,
  isFirebaseConfigured,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
};
