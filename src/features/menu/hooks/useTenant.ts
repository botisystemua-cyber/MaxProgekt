import { useEffect, useState } from 'react';
import { supabase } from '@/shared/lib/supabase';
import type { Tenant } from '@/shared/types/database';

interface UseTenantResult {
  tenant: Tenant | null;
  loading: boolean;
  error: Error | null;
}

export function useTenant(slug: string | undefined): UseTenantResult {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) setError(err);
        else setTenant(data as Tenant | null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { tenant, loading, error };
}
