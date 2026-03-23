import { useState, useEffect, useCallback, useRef } from 'react';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, getDocs, getFirestore, onSnapshot } from 'firebase/firestore';
import type { VendorInfo } from './types';

function getOrInitFirebaseApp() {
  if (getApps().length > 0) return getApp();

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) return null;

  return initializeApp({
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  });
}

async function ensureAuth(app: ReturnType<typeof getApp>) {
  const auth = getAuth(app);
  if (auth.currentUser) return;
  await signInAnonymously(auth);
}

export function useVendors() {
  const [vendors, setVendors] = useState<VendorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dbRef = useRef<ReturnType<typeof getFirestore> | null>(null);

  useEffect(() => {
    const app = getOrInitFirebaseApp();
    if (!app) {
      setError('Firebase not initialized: missing VITE_FIREBASE_API_KEY or VITE_FIREBASE_PROJECT_ID');
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    ensureAuth(app)
      .then(() => {
        const db = getFirestore(app);
        dbRef.current = db;
        unsubscribe = onSnapshot(
          collection(db, 'vendors'),
          (snapshot) => {
            setVendors(snapshot.docs.map((doc) => doc.data() as VendorInfo));
            setLoading(false);
          },
          (err) => {
            setError(err.message);
            setLoading(false);
          },
        );
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    return () => unsubscribe?.();
  }, []);

  const refresh = useCallback(async () => {
    const db = dbRef.current;
    if (!db) return;
    const snapshot = await getDocs(collection(db, 'vendors'));
    setVendors(snapshot.docs.map((doc) => doc.data() as VendorInfo));
  }, []);

  return { vendors, loading, error, refresh };
}
