/**
 * Firebase Project Configuration for Jeev Jantu Vihar (JJV Bhopal) Web App
 */

export const firebaseConfig = {
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || "AIzaSyB_jjvBhopalSanctuaryKey2026",
  authDomain: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || "jjv-bhopal-shelter.firebaseapp.com",
  projectId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || "jjv-bhopal-shelter",
  storageBucket: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || "jjv-bhopal-shelter.appspot.com",
  messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || "9826012026",
  appId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) || "1:9826012026:web:bhopaljjvcompanion2026"
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.projectId && firebaseConfig.apiKey
);
