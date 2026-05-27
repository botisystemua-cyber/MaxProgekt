import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminShell } from '../components/AdminShell';
import { useAdminTenant } from '../hooks/useAdminTenant';
import { useAdminMenu } from '../hooks/useAdminMenu';
import { supabase } from '@/shared/lib/supabase';
import { translateCategory } from '@/features/menu/utils/translate';
import type { Language, MenuItem } from '@/shared/types/database';

export default function MenuManagePage() {
  const { t, i18n } = useTranslation();
  const { tenant } = useAdminTenant();
  const { data, loading, reload } = useAdminMenu(tenant?.id);
  const [busyId, setBusyId] = useState<string | null>(null);

  const language = (i18n.language || 'es') as Language;
  const fallback = (tenant?.default_language ?? 'es') as Language;
  const currency = tenant?.currency ?? 'EUR';

  const grouped = useMemo(() => {
    if (!data) return [];
    return data.categories.map((cat) => ({
      cat,
      items: data.items.filter((i) => i.category_id === cat.id),
    }));
  }, [data]);

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
      <div className="mx-auto max-w-3xl space-y-5 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{t('admin.menuManage')}</h1>
          <Link
            to="/admin/menu/item/new"
            className="rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-semibold text-white shadow-soft"
          >
            ＋ {t('admin.newItem')}
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">{t('common.loading')}</p>
        ) : grouped.length === 0 ? (
          <p className="rounded-xl bg-slate-900 p-4 text-sm text-slate-400 ring-1 ring-slate-800">
            No categories yet.
          </p>
        ) : (
          grouped.map(({ cat, items }) => {
            const { name } = translateCategory(
              cat,
              data?.categoryTranslations ?? [],
              language,
              fallback,
            );
            return (
              <section key={cat.id}>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                  <span className="text-base">{cat.icon}</span>
                  <span>{name}</span>
                  <span className="ml-auto text-[10px] text-slate-500">{items.length}</span>
                </h2>
                {items.length === 0 ? (
                  <p className="rounded-xl bg-slate-900/60 p-3 text-xs text-slate-500 ring-1 ring-slate-800">
                    Empty
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-3 rounded-2xl bg-slate-900 p-3 ring-1 ring-slate-800"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{item.name}</div>
                          <div className="text-xs text-slate-400 tabular-nums">
                            {item.price.toFixed(2)} {currency}
                            {item.discount_percent > 0 ? (
                              <span className="ml-2 rounded bg-rose-900/40 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
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
                            item.is_available ? 'bg-emerald-500' : 'bg-slate-700'
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
                          className="shrink-0 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold hover:bg-slate-700"
                        >
                          {t('common.edit')}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })
        )}
      </div>
    </AdminShell>
  );
}
