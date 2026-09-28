# Jeev Jantu Vihar (जीव जंतु विहार) — Bhopal Animal Shelter Management System

Production-ready sanctuary management system for animal census, medical profiles, treatments, and before/after photo documentation.

## Project Architecture

1. **`jjv-web/`** &mdash; Admin & Clinical Web Dashboard (React 18 + Vite + Tailwind CSS)
   - Real-time census statistics & recovery ratios.
   - Dedicated Dog Section 🐕 & Gaushala Cow Section 🐄.
   - Animal profile view with side-by-side Before & After recovery photos.
   - Full Add/Edit form with client-side image compression and photo uploads.
   - Instant Bilingual Switcher (English / हिन्दी).
   - Multi-role simulation (Admin vs Worker roles with permission enforcement).
   - CSV Census Export.
   - Embedded Field Worker Mobile App Simulator.

2. **`jjv-mobile/`** &mdash; Worker Companion Mobile App (React Native / Expo)
   - Lightweight, thumb-friendly UI for caretakers, compounders, and ambulance drivers.
   - Quick "Log New Rescue" with camera & gallery photo capture.
   - Bilingual support (Hindi/English).

3. **`supabase/schema.sql`** &mdash; PostgreSQL Database & Storage Migration
   - `profiles` table with role-based policies.
   - `animals` table with custom auto-sequence ID triggers (`JJV-D-001`, `JJV-C-001`).
   - Row-Level Security (RLS) guaranteeing worker restrictions (no delete).
   - `animal-photos` storage bucket policies.

---

## Quick Start (Web Dashboard)

```bash
cd "c:\Users\Aryan\Documents\jjv app\jjv-web"
npm run dev
```

Open your browser at `http://localhost:5173/`.

### Supabase Connectivity (Optional)
The application works immediately out-of-the-box using persistent local storage pre-seeded with Bhopal shelter rescues.
To connect to live Supabase:
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Copy and run the SQL in `supabase/schema.sql` in the Supabase SQL Editor.
3. Create a `.env` file in `jjv-web/`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Restart the web server.

---

## Deploy to Google Cloud (Firebase Hosting)

Every Firebase project is a Google Cloud Platform (GCP) project. You can deploy the web app directly to Google Cloud's global CDN:

1. **Sign in to your Google Cloud / Firebase Account**:
   ```bash
   cd "jjv-web"
   npx firebase login
   ```
   *(Opens your browser to authenticate with your Google Cloud account).*

2. **Select or Initialize your GCP Project**:
   ```bash
   npx firebase use --add
   ```
   *(Choose your existing GCP / Firebase project or create one at [console.firebase.google.com](https://console.firebase.google.com) or [console.cloud.google.com](https://console.cloud.google.com)).*

3. **Deploy to Google Cloud**:
   ```bash
   npm run deploy
   ```
   *(Builds the Vite SPA and deploys it live to Google Cloud CDN).*

---

## Quick Start (Mobile App)

```bash
cd "c:\Users\Aryan\Documents\jjv app\jjv-mobile"
npm install
npx expo start
```
Scan the QR code with the **Expo Go** app on your Android or iOS device.
