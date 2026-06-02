import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminShell } from '../components/AdminShell';
import { CategoryEditModal } from '../components/CategoryEditModal';
import { useAdminTenant } from '../hooks/useAdminTenant';
import { useAdminMenu } from '../hooks/useAdminMenu';
import { translateCategory } from '@/features/menu/utils/translate';
import type { Category, Language } from '@/shared/types/database';

export default function MenuManagePage() {
  const { t, i18n } = useTranslation();
  const { tenant } = useAdminTenant();
  const { data, loading, reload } = useAdminMenu(tenant?.id);
  const [editing, setEditing] = useState<Category | 'new' | null>(null);

  const language = (i18n.language || 'es') as Language;
  const fallback = (tenant?.default_language ?? 'es') as Language;

  const categoriesWithCount = (data?.categories ?? []).map((cat) => ({
    cat,
    count: (data?.items ?? []).filter((i) => i.category_id === cat.id).length,
  }));

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{t('admin.menuTab')}</h1>
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-semibold text-white shadow-soft"
          >
            ＋ {t('admin.menuManagePage.newCategory')}
          </button>
        </div>

        {loading && categoriesWithCount.length === 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-900" />
            ))}
          </div>
        ) : categoriesWithCount.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
            {t('admin.menuManagePage.noCategories')}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {categoriesWithCount.map(({ cat, count }) => {
              const { name } = translateCategory(
                cat,
                data?.categoryTranslations ?? [],
                language,
                fallback,
              );
              return (
                <div
                  key={cat.id}
                  className="group relative flex aspect-square flex-col items-start justify-between rounded-2xl bg-slate-50 p-4 shadow-soft ring-1 ring-slate-200 transition active:scale-95 hover:bg-slate-100 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800 dark:hover:bg-slate-800"
                >
                  <Link
                    to={`/admin/menu/category/${cat.id}`}
                    className="absolute inset-0 z-0 rounded-2xl"
                    aria-label={name}
                  />

                  <span className="relative z-10 text-3xl">{cat.icon}</span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditing(cat);
                    }}
                    aria-label={t('common.edit')}
                    className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 text-slate-600 opacity-0 ring-1 ring-slate-200 transition-opacity hover:bg-white group-hover:opacity-100 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
                  >
                    ✎
                  </button>

                  <div className="relative z-10">
                    <div className="text-base font-bold text-slate-900 dark:text-white">{name}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {t('admin.menuManagePage.itemsCount', { count })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="pt-2 text-center text-[11px] text-slate-500 dark:text-slate-500">
          {t('admin.menuManagePage.tapHint')}
        </p>
      </div>

      {editing !== null && tenant ? (
        <CategoryEditModal
          tenantId={tenant.id}
          category={editing === 'new' ? null : editing}
          existingCategories={data?.categories ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void reload();
          }}
        />
      ) : null}
    </AdminShell>
  );
}
