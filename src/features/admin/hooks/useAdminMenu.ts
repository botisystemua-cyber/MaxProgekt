import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/shared/lib/supabase';
import type {
  Category,
  CategoryTranslation,
  DailySpecial,
  MenuItem,
  MenuItemTranslation,
} from '@/shared/types/database';

export interface AdminMenuData {
  categories: Category[];
  items: MenuItem[];
  categoryTranslations: CategoryTranslation[];
  itemTranslations: MenuItemTranslation[];
  specials: DailySpecial[];
}

const empty: AdminMenuData = {
  categories: [],
  items: [],
  categoryTranslations: [],
  itemTranslations: [],
  specials: [],
};

export function useAdminMenu(tenantId: string | null | undefined) {
  const [data, setData] = useState<AdminMenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (!tenantId) {
      setData(empty);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [cats, items, specials] = await Promise.all([
        supabase.from('categories').select('*').eq('tenant_id', tenantId).order('sort_order'),
        supabase.from('menu_items').select('*').eq('tenant_id', tenantId).order('sort_order'),
        supabase.from('daily_specials').select('*').eq('tenant_id', tenantId).order('starts_at', { ascending: false }),
      ]);
      if (cats.error) throw cats.error;
      if (items.error) throw items.error;
      if (specials.error) throw specials.error;

      const catIds = (cats.data ?? []).map((c) => c.id);
      const itemIds = (items.data ?? []).map((i) => i.id);

      const [catTr, itemTr] = await Promise.all([
        catIds.length
          ? supabase.from('category_translations').select('*').in('category_id', catIds)
          : Promise.resolve({ data: [], error: null }),
        itemIds.length
          ? supabase.from('menu_item_translations').select('*').in('menu_item_id', itemIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (catTr.error) throw catTr.error;
      if (itemTr.error) throw itemTr.error;

      setData({
        categories: (cats.data ?? []) as Category[],
        items: (items.data ?? []) as MenuItem[],
        specials: (specials.data ?? []) as DailySpecial[],
        categoryTranslations: (catTr.data ?? []) as CategoryTranslation[],
        itemTranslations: (itemTr.data ?? []) as MenuItemTranslation[],
      });
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
