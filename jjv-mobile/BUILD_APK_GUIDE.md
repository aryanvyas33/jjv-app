# Jeev Jantu Vihar (JJV Mobile) &mdash; APK Build & Firebase Guide

This project is now fully configured with **Firebase Cloud Firestore** and ready for standalone **Android APK generation**.

---

## 1. Firebase & Database Implementation

The app is connected to **Firebase Cloud Firestore**:
- **Config file**: [`src/lib/firebaseConfig.js`](file:///c:/Users/Aryan/Documents/jjv%20app/jjv-mobile/src/lib/firebaseConfig.js)
- **Firebase client**: [`src/lib/firebase.js`](file:///c:/Users/Aryan/Documents/jjv%20app/jjv-mobile/src/lib/firebase.js)
- **Database CRUD & Realtime API**: [`src/lib/api.js`](file:///c:/Users/Aryan/Documents/jjv%20app/jjv-mobile/src/lib/api.js)
- **Environment variables**: [`.env`](file:///c:/Users/Aryan/Documents/jjv%20app/jjv-mobile/.env) and [`.env.example`](file:///c:/Users/Aryan/Documents/jjv%20app/jjv-mobile/.env.example)

### Features:
1. **Firestore Collections**: All rescues are stored under the `animals` Firestore collection.
2. **Real-time Synchronization**: Using `subscribeToAnimals` (`onSnapshot`), any rescue logged or updated is immediately synchronized in real time.
3. **Offline Fallback**: Uses `AsyncStorage` caching so the app continues working smoothly even without internet connectivity.
4. **Live Indicator**: The mobile app header displays `🔥 Firebase Connected` (or `💾 Offline Storage`).

---

## 2. Generating the Android APK

You have two easy ways to generate the `.apk` file:

### Option A: Cloud APK Build with EAS (Recommended & Fastest &mdash; No Android SDK / Java Setup Needed)

1. Open PowerShell / Command Prompt:
   ```bash
   cd "c:\Users\Aryan\Documents\jjv app\jjv-mobile"
   ```

2. Log in to your free Expo account (create one at [expo.dev/signup](https://expo.dev/signup) if you don't have one):
   ```bash
   npx eas-cli login
   ```

3. Trigger the APK build:
   ```bash
   npm run build:apk
   ```
   *(or `npx eas-cli build -p android --profile preview`)*

4. EAS Build runs the compilation on Expo's cloud build servers and gives you a direct **Download APK Link** and a **QR Code** to install the APK directly onto any Android phone.

---

### Option B: Local APK Build with Android Studio

The complete native Android project has already been pre-generated in [`android/`](file:///c:/Users/Aryan/Documents/jjv%20app/jjv-mobile/android).

1. Open **Android Studio**.
2. Click **Open** and select the folder:
   `c:\Users\Aryan\Documents\jjv app\jjv-mobile\android`
3. Wait for Gradle sync to finish.
4. Click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
5. Android Studio will generate the APK at:
   `android/app/build/outputs/apk/debug/app-debug.apk`
