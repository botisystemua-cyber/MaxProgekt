import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/shared/lib/supabase';

export interface PlatformTenant {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  owner_email: string | null;
  items_count: number;
  created_at: string;
}

export function usePlatform() {
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.rpc('list_tenants_admin');
    if (err) setError(err.message);
    else setTenants((data ?? []) as PlatformTenant[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { tenants, loading, error, reload };
}
