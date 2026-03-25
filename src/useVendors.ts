import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, getDocs, getFirestore, onSnapshot } from 'firebase/firestore';
import { getOrInitFirebaseApp, ensureAuth } from './firebase';
import type { VendorInfo } from './types';

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
            setVendors(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as VendorInfo));
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
    setVendors(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as VendorInfo));
  }, []);

  return { vendors, loading, error, refresh };
}
