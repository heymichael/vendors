import { useState, useEffect, useCallback } from 'react';
import { agentFetch } from '@haderach/shared-ui';
import { useAuthUser } from './auth/AuthUserContext';
import type { VendorInfo } from './types';

export function useVendors() {
  const { getIdToken } = useAuthUser();
  const [vendors, setVendors] = useState<VendorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    try {
      const res = await agentFetch('/vendors', getIdToken);
      if (!res.ok) throw new Error(`Failed to fetch vendors: ${res.status}`);
      const data: VendorInfo[] = await res.json();
      setVendors(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  return { vendors, loading, error, refresh: fetchVendors };
}
