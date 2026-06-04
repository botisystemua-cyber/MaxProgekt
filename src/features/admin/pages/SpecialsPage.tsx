import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminShell } from '../components/AdminShell';
import { useAdminTenant } from '../hooks/useAdminTenant';
import { useAdminMenu } from '../hooks/useAdminMenu';
import { useSpecials } from '../hooks/useSpecials';
import type { DailySpecial } from '@/shared/types/database';

const TYPE_META: Record<DailySpecial['special_type'], { emoji: string; key: string; cls: string }> = {
  daily:      { emoji: '🍳', key: 'admin.specialsPage.typeDaily',     cls: 'bg-amber-500/15 text-amber-300 ring-amber-500/30' },
  promo:      { emoji: '🔥', key: 'admin.specialsPage.typePromo',     cls: 'bg-rose-500/15 text-rose-300 ring-rose-500/30' },
  happy_hour: { emoji: '🍹', key: 'admin.specialsPage.typeHappyHour', cls: 'bg-sky-500/15 text-sky-300 ring-sky-500/30' },
};

export default function SpecialsPage() {
  const { t } = useTranslation();
  const { tenant } = useAdminTenant();
  const { data: menu } = useAdminMenu(tenant?.id);
  const { specials, loading, error, toggleActive, remove, create } = useSpecials(tenant?.id);
  const [showCreate, setShowCreate] = useState(false);

  const itemById = useMemo(() => {
    const m: Record<string, { name: string; price: number }> = {};
    for (const it of menu?.items ?? []) m[it.id] = { name: it.name, price: it.price };
    return m;
  }, [menu]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('admin.specialsPage.title')}
          </h1>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-semibold text-white shadow-soft"
          >
            ＋ {t('admin.specialsPage.create')}
          </button>
        </div>

        <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:ring-slate-800">
          💡 {t('admin.specialsPage.hint')}
        </p>

        {error ? (
          <div className="rounded-xl bg-rose-100 p-3 text-sm text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        {loading && specials.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-900" />
            ))}
          </div>
        ) : specials.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
            {t('admin.specialsPage.empty')}
          </div>
        ) : (
          <ul className="space-y-2">
            {specials.map((s) => {
              const meta = TYPE_META[s.special_type];
              const item = itemById[s.menu_item_id];
              const expired = s.ends_at && new Date(s.ends_at) < new Date();
              return (
                <li
                  key={s.id}
                  className={`rounded-2xl bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 ${
                    s.is_active ? '' : 'opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${meta.cls}`}>
                          {meta.emoji} {t(meta.key)}
                        </span>
                        {expired ? (
                          <span className="text-[10px] text-rose-500">⏰ {t('admin.specialsPage.expired')}</span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                        {item?.name ?? '—'}
                      </div>
                      <div className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {item ? `${item.price.toFixed(2)} → ` : ''}
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {s.special_price?.toFixed(2)} EUR
                        </span>
                        {s.ends_at ? (
                          <span className="ml-2 text-slate-400">
                            · {t('admin.specialsPage.until')} {new Date(s.ends_at).toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void toggleActive(s.id, !s.is_active)}
                      aria-pressed={s.is_active}
                      title={s.is_active ? t('admin.specialsPage.disable') : t('admin.specialsPage.enable')}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                        s.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          s.is_active ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(t('admin.specialsPage.deleteConfirm'))) void remove(s.id);
                      }}
                      aria-label={t('common.delete')}
                      className="shrink-0 rounded-lg bg-slate-100 px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-100 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-rose-900/40"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showCreate && tenant ? (
        <CreateSpecialModal
          items={(menu?.items ?? []).filter((i) => i.is_available)}
          onClose={() => setShowCreate(false)}
          onCreate={async (payload) => {
            await create(payload);
            setShowCreate(false);
          }}
        />
      ) : null}
    </AdminShell>
  );
}

interface CreateModalProps {
  items: Array<{ id: string; name: string; price: number }>;
  onClose: () => void;
  onCreate: (payload: {
    menu_item_id: string;
    special_type: DailySpecial['special_type'];
    special_price: number;
    duration_hours: number;
  }) => Promise<void>;
}

function CreateSpecialModal({ items, onClose, onCreate }: CreateModalProps) {
  const { t } = useTranslation();
  const [menuItemId, setMenuItemId] = useState<string>('');
  const [type, setType] = useState<DailySpecial['special_type']>('daily');
  const [price, setPrice] = useState<string>('');
  const [duration, setDuration] = useState<string>('0');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!menuItemId || !price) return;
    setSaving(true);
    await onCreate({
      menu_item_id: menuItemId,
      special_type: type,
      special_price: Number(price),
      duration_hours: Number(duration),
    });
    setSaving(false);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-3 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[92vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
      >
        <div className="flex shrink-0 items-center justify-between px-4 pt-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t('admin.specialsPage.create')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 pt-3">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
              {t('admin.specialsPage.dish')}
            </span>
            <select
              required
              value={menuItemId}
              onChange={(e) => setMenuItemId(e.target.value)}
              className="w-full rounded-lg bg-slate-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary dark:bg-slate-800 dark:text-white"
            >
              <option value="">—</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name} · €{it.price.toFixed(2)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
              {t('admin.specialsPage.type')}
            </span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DailySpecial['special_type'])}
              className="w-full rounded-lg bg-slate-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary dark:bg-slate-800 dark:text-white"
            >
              <option value="daily">🍳 {t('admin.specialsPage.typeDaily')}</option>
              <option value="promo">🔥 {t('admin.specialsPage.typePromo')}</option>
              <option value="happy_hour">🍹 {t('admin.specialsPage.typeHappyHour')}</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
              {t('admin.specialsPage.specialPrice')}
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="5.00"
              className="w-full rounded-lg bg-slate-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary dark:bg-slate-800 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
              {t('admin.specialsPage.duration')}
            </span>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-lg bg-slate-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary dark:bg-slate-800 dark:text-white"
            >
              <option value="0">{t('admin.specialsPage.durationUnlimited')}</option>
              <option value="2">2 {t('admin.specialsPage.hours')}</option>
              <option value="4">4 {t('admin.specialsPage.hours')}</option>
              <option value="6">6 {t('admin.specialsPage.hours')}</option>
              <option value="24">24 {t('admin.specialsPage.hours')}</option>
              <option value="48">48 {t('admin.specialsPage.hours')}</option>
            </select>
          </label>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-lg bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving || !menuItemId || !price}
            className="flex-1 rounded-lg bg-brand-primary px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
