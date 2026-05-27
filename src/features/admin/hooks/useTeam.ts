import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/shared/lib/supabase';

export interface TeamMember {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'waiter' | 'superadmin';
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.rpc('list_team');
    if (err) setError(err.message);
    else setMembers((data ?? []) as TeamMember[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { members, loading, error, reload };
}
