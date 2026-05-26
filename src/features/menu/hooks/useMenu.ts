import { useEffect, useState } from 'react';
import { supabase } from '@/shared/lib/supabase';
import type {
  Category,
  CategoryTranslation,
  DailySpecial,
  MenuItem,
  MenuItemTranslation,
} from '@/shared/types/database';

export interface MenuData {
  categories: Category[];
  items: MenuItem[];
  categoryTranslations: CategoryTranslation[];
  itemTranslations: MenuItemTranslation[];
  specials: DailySpecial[];
}

interface UseMenuResult {
  data: MenuData | null;
  loading: boolean;
  error: Error | null;
}

const empty: MenuData = {
  categories: [],
  items: [],
  categoryTranslations: [],
  itemTranslations: [],
  specials: [],
};

export function useMenu(tenantId: string | undefined): UseMenuResult {
  const [data, setData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setData(empty);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load(id: string) {
      const [cats, items, specials] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('tenant_id', id)
          .order('sort_order', { ascending: true }),
        supabase
          .from('menu_items')
          .select('*')
          .eq('tenant_id', id)
          .order('sort_order', { ascending: true }),
        supabase
          .from('daily_specials')
          .select('*')
          .eq('tenant_id', id)
          .eq('is_active', true),
      ]);

      if (cats.error) throw cats.error;
      if (items.error) throw items.error;
      if (specials.error) throw specials.error;

      // Переклади тягнемо окремо, тільки для отриманих id (RLS public-read).
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

      return {
        categories: (cats.data ?? []) as Category[],
        items: (items.data ?? []) as MenuItem[],
        specials: (specials.data ?? []) as DailySpecial[],
        categoryTranslations: (catTr.data ?? []) as CategoryTranslation[],
        itemTranslations: (itemTr.data ?? []) as MenuItemTranslation[],
      };
    }

    load(tenantId)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err as Error);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  return { data, loading, error };
}
