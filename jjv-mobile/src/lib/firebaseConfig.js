/**
 * Firebase Project Configuration for Jeev Jantu Vihar (JJV Bhopal)
 * 
 * You can supply custom credentials via environment variables (.env in jjv-mobile):
 * EXPO_PUBLIC_FIREBASE_API_KEY
 * EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
 * EXPO_PUBLIC_FIREBASE_PROJECT_ID
 * EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
 * EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * EXPO_PUBLIC_FIREBASE_APP_ID
 */

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyB_jjvBhopalSanctuaryKey2026",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "jjv-bhopal-shelter.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "jjv-bhopal-shelter",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "jjv-bhopal-shelter.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "9826012026",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:9826012026:android:bhopaljjvcompanion2026"
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.projectId && firebaseConfig.apiKey
);
