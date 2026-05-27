import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminShell } from '../components/AdminShell';
import { MenuShareCard } from '../components/MenuShareCard';
import { useAdminTenant } from '../hooks/useAdminTenant';
import { useAdminMenu } from '../hooks/useAdminMenu';

function StatCard({ icon, label, value }: { icon: string; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 text-2xl font-extrabold tabular-nums">{value}</div>
      <div className="text-xs uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { tenant } = useAdminTenant();
  const { data, loading } = useAdminMenu(tenant?.id);

  const items = data?.items ?? [];
  const categories = data?.categories ?? [];
  const specials = data?.specials ?? [];
  const activeSpecials = specials.filter((s) => s.is_active && (!s.ends_at || new Date(s.ends_at) > new Date()));
  const availableCount = items.filter((i) => i.is_available).length;
  const hiddenCount = items.length - availableCount;

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        {tenant ? <MenuShareCard tenant={tenant} variant="compact" /> : null}

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-900" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon="🍽️" label="items" value={items.length} />
            <StatCard icon="📂" label="categories" value={categories.length} />
            <StatCard icon="✅" label="available" value={availableCount} />
            <StatCard icon="🙈" label="hidden" value={hiddenCount} />
          </div>
        )}

        {activeSpecials.length > 0 ? (
          <div className="rounded-2xl bg-gradient-to-r from-orange-600 to-rose-600 p-4 text-white">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/80">
              🔥 active promotions
            </div>
            <div className="mt-1 text-lg font-bold">{activeSpecials.length}</div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/admin/menu/item/new"
            className="rounded-2xl bg-brand-primary p-4 text-center text-sm font-semibold text-white shadow-raised"
          >
            ＋ {t('admin.newItem')}
          </Link>
          <Link
            to="/admin/menu"
            className="rounded-2xl bg-slate-800 p-4 text-center text-sm font-semibold"
          >
            {t('admin.menuManage')}
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}
