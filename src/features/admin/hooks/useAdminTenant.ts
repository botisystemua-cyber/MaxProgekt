import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/AuthProvider';
import type { Tenant } from '@/shared/types/database';

export function useAdminTenant() {
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenant_id ?? null;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    setTenant((data as Tenant | null) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!tenantId) {
      setTenant(null);
      setLoading(false);
      return;
    }
    void load(tenantId);
  }, [tenantId, load]);

  const refresh = useCallback(() => {
    if (tenantId) void load(tenantId);
  }, [tenantId, load]);

  return { tenant, loading, refresh };
}
