import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Guard: during static prerender (or if env vars are missing) apiKey is
// undefined and getAuth() would throw at import time, breaking the build.
// Initialize only when config is present; real usage happens client-side
// where the NEXT_PUBLIC_* vars are inlined at build.
let app: FirebaseApp | undefined;
let auth: Auth = undefined as unknown as Auth;
let db: Firestore = undefined as unknown as Firestore;

if (firebaseConfig.apiKey) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else if (typeof window !== "undefined") {
  // Only warn in the browser — missing env at runtime is a real misconfig.
  console.error(
    "Firebase config missing. Set NEXT_PUBLIC_FIREBASE_* env vars in Vercel and redeploy."
  );
}

export { auth, db };
export const googleProvider = new GoogleAuthProvider();
export default app;
