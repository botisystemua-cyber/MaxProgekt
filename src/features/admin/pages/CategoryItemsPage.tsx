import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminShell } from '../components/AdminShell';
import { useAdminTenant } from '../hooks/useAdminTenant';
import { useAdminMenu } from '../hooks/useAdminMenu';
import { supabase } from '@/shared/lib/supabase';
import { translateCategory } from '@/features/menu/utils/translate';
import type { Language, MenuItem } from '@/shared/types/database';

export default function CategoryItemsPage() {
  const { catId } = useParams<{ catId: string }>();
  const { t, i18n } = useTranslation();
  const { tenant } = useAdminTenant();
  const { data, loading, reload } = useAdminMenu(tenant?.id);
  const [busyId, setBusyId] = useState<string | null>(null);

  const language = (i18n.language || 'es') as Language;
  const fallback = (tenant?.default_language ?? 'es') as Language;
  const currency = tenant?.currency ?? 'EUR';

  const category = useMemo(
    () => data?.categories.find((c) => c.id === catId) ?? null,
    [data, catId],
  );

  const items = useMemo(
    () => (data?.items ?? []).filter((i) => i.category_id === catId),
    [data, catId],
  );

  // Редірект тільки коли є дані з реальними категоріями, але серед них
  // нема цієї. Інакше при першому рендері (tenant ще не завантажений,
  // data повертається як empty placeholder) нас викидало назад одразу.
  if (data && data.categories.length > 0 && !category) {
    return <Navigate to="/admin/menu" replace />;
  }

  const { name: catName } = category
    ? translateCategory(category, data?.categoryTranslations ?? [], language, fallback)
    : { name: '' };

  async function toggleAvailable(item: MenuItem) {
    setBusyId(item.id);
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id);
    setBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    void reload();
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <Link to="/admin/menu" className="text-sm text-brand-primary">
          ← {t('common.back')}
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
            <span className="text-2xl">{category?.icon}</span>
            <span>{catName || '…'}</span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              · {items.length}
            </span>
          </h1>
          <Link
            to={`/admin/menu/item/new?categoryId=${catId}`}
            className="rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-semibold text-white shadow-soft"
          >
            ＋ {t('admin.newItem')}
          </Link>
        </div>

        {loading && items.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-900" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
            {t('admin.menuManagePage.empty')}
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {item.name}
                  </div>
                  <div className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                    {item.price.toFixed(2)} {currency}
                    {item.discount_percent > 0 ? (
                      <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                        -{item.discount_percent}%
                      </span>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void toggleAvailable(item)}
                  disabled={busyId === item.id}
                  aria-pressed={item.is_available}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    item.is_available ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  } disabled:opacity-50`}
                  title={item.is_available ? 'available' : 'hidden'}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      item.is_available ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>

                <Link
                  to={`/admin/menu/item/${item.id}`}
                  className="shrink-0 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {t('common.edit')}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
