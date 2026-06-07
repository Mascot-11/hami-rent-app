/**
 * useOfflineData.ts
 * Returns data from IndexedDB when offline, Supabase when online.
 * Writes go to both IndexedDB (immediately) + sync queue (for later push).
 */

import { useState, useEffect } from "react";
import { offlineDB } from "@/lib/offline-db";

export function useOfflineTenants() {
  const [tenants, setTenants] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    offlineDB.getTenants().then((data) => {
      setTenants(data);
      setLoading(false);
    });
  }, []);

  return { tenants, loading, refresh: () => offlineDB.getTenants().then(setTenants) };
}

export function useOfflineBills() {
  const [bills, setBills] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    offlineDB.getBills().then((data) => {
      setBills(data);
      setLoading(false);
    });
  }, []);

  return { bills, loading, refresh: () => offlineDB.getBills().then(setBills) };
}
