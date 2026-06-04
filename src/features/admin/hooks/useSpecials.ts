import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/shared/lib/supabase';
import type { DailySpecial } from '@/shared/types/database';

/**
 * Завантажує усі daily_specials тенанта (включно з is_active=false), щоб
 * у керуванні бачити повний список і вмикати/вимикати.
 */
export function useSpecials(tenantId: string | null | undefined) {
  const [specials, setSpecials] = useState<DailySpecial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!tenantId) {
      setSpecials([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('daily_specials')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('starts_at', { ascending: false });
    if (err) setError(err.message);
    else setSpecials((data ?? []) as DailySpecial[]);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function toggleActive(id: string, next: boolean): Promise<void> {
    const { error: err } = await supabase
      .from('daily_specials')
      .update({ is_active: next })
      .eq('id', id);
    if (err) setError(err.message);
    else await reload();
  }

  async function remove(id: string): Promise<void> {
    const { error: err } = await supabase.from('daily_specials').delete().eq('id', id);
    if (err) setError(err.message);
    else await reload();
  }

  async function create(input: {
    menu_item_id: string;
    special_type: DailySpecial['special_type'];
    special_price: number;
    duration_hours: number; // 0 = no end
  }): Promise<void> {
    if (!tenantId) return;
    const endsAt =
      input.duration_hours > 0
        ? new Date(Date.now() + input.duration_hours * 3600_000).toISOString()
        : null;
    const { error: err } = await supabase.from('daily_specials').insert({
      tenant_id: tenantId,
      menu_item_id: input.menu_item_id,
      special_type: input.special_type,
      special_price: input.special_price,
      is_active: true,
      starts_at: new Date().toISOString(),
      ends_at: endsAt,
    });
    if (err) setError(err.message);
    else await reload();
  }

  return { specials, loading, error, reload, toggleActive, remove, create };
}
