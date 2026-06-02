import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminShell } from '../components/AdminShell';
import { useAuth } from '@/features/auth/AuthProvider';
import { useAdminTenant } from '../hooks/useAdminTenant';
import { useAdminMenu } from '../hooks/useAdminMenu';
import { canAccess, type Section } from '../lib/permissions';

/**
 * Анімує число від 0 до target за `duration` мс із ease-out cubic.
 * RAF-based — плавно, дешево. Скидається при зміні target.
 */
function useCountUp(target: number, duration = 2000): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target <= 0) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

interface StatProps {
  value: number;
  label: string;
  accent?: 'default' | 'emerald';
}

function StatPill({ value, label, accent = 'default' }: StatProps) {
  const animated = useCountUp(value);
  const valueColor =
    accent === 'emerald'
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-slate-900 dark:text-white';
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-slate-50 to-white px-3 py-3 ring-1 ring-slate-200 shadow-soft dark:from-slate-800 dark:to-slate-900 dark:ring-white/5 dark:shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div
        className={`text-3xl font-black tabular-nums ${valueColor} dark:drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`}
      >
        {animated}
      </div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </div>
    </div>
  );
}

interface ActionTileProps {
  to: string;
  icon: string;
  title: string;
  hint: string;
}

function ActionTile({ to, icon, title, hint }: ActionTileProps) {
  return (
    <Link
      to={to}
      className="flex aspect-square flex-col items-start justify-between rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 shadow-soft transition active:scale-95 hover:bg-slate-100 dark:bg-slate-900 dark:ring-slate-800 dark:shadow-none dark:hover:bg-slate-800"
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <div className="text-base font-bold text-slate-900 dark:text-white">{title}</div>
        <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{hint}</div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { tenant } = useAdminTenant();
  const { data, loading } = useAdminMenu(tenant?.id);

  const items = data?.items ?? [];
  const categories = data?.categories ?? [];
  const availableCount = items.filter((i) => i.is_available).length;
  const role = currentUser?.role;

  const allTiles: Array<{ section: Section; to: string; icon: string; title: string; hint: string }> = [
    { section: 'menu',     to: '/admin/menu',          icon: '🍽️', title: t('admin.tile.menuTitle'),     hint: t('admin.tile.menuHint') },
    { section: 'newItem',  to: '/admin/menu/item/new', icon: '➕',  title: t('admin.tile.newItemTitle'),  hint: t('admin.tile.newItemHint') },
    { section: 'orders',   to: '/admin/orders',        icon: '📋', title: t('admin.tile.ordersTitle'),   hint: t('admin.tile.ordersHint') },
    { section: 'share',    to: '/admin/share',         icon: '🔗', title: t('admin.tile.shareTitle'),    hint: t('admin.tile.shareHint') },
    { section: 'settings', to: '/admin/settings',      icon: '⚙️', title: t('admin.tile.settingsTitle'), hint: t('admin.tile.settingsHint') },
    { section: 'team',     to: '/admin/team',          icon: '👥', title: t('admin.tile.teamTitle'),     hint: t('admin.tile.teamHint') },
    { section: 'platform', to: '/admin/platform',      icon: '🌐', title: t('admin.tile.platformTitle'), hint: t('admin.tile.platformHint') },
  ];
  const tiles = allTiles.filter((tile) => canAccess(role, tile.section));

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        {/* Animated stats — одразу після шапки. Числа об'ємні, count-up 0→ціль за 2с. */}
        {!loading ? (
          <div className="grid grid-cols-3 gap-2">
            <StatPill value={items.length} label={t('admin.stats.items')} />
            <StatPill value={categories.length} label={t('admin.stats.categories')} />
            <StatPill value={availableCount} label={t('admin.stats.available')} accent="emerald" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-900" />
            ))}
          </div>
        )}

        {/* Дозволені плитки залежать від ролі (див. permissions.ts) */}
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((tile) => (
            <ActionTile
              key={tile.to}
              to={tile.to}
              icon={tile.icon}
              title={tile.title}
              hint={tile.hint}
            />
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
