import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminShell } from '../components/AdminShell';
import { MenuShareCard } from '../components/MenuShareCard';
import { useAuth } from '@/features/auth/AuthProvider';
import { useAdminTenant } from '../hooks/useAdminTenant';
import { useAdminMenu } from '../hooks/useAdminMenu';

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
      className="flex aspect-square flex-col items-start justify-between rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800 transition active:scale-95 hover:bg-slate-800"
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <div className="text-base font-bold text-white">{title}</div>
        <div className="mt-0.5 text-[11px] text-slate-400">{hint}</div>
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
  const isSuperadmin = currentUser?.role === 'superadmin';

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        {tenant ? <MenuShareCard tenant={tenant} variant="compact" /> : null}

        {/* 4 (або 5 для superadmin) великі action-плитки */}
        <div className="grid grid-cols-2 gap-3">
          <ActionTile
            to="/admin/menu"
            icon="🍽️"
            title={t('admin.tile.menuTitle')}
            hint={
              loading
                ? '…'
                : t('admin.tile.menuHint', { count: items.length, defaultValue: '{{count}} страв' })
            }
          />
          <ActionTile
            to="/admin/menu/item/new"
            icon="➕"
            title={t('admin.tile.newItemTitle')}
            hint={t('admin.tile.newItemHint')}
          />
          <ActionTile
            to="/admin/settings"
            icon="⚙️"
            title={t('admin.tile.settingsTitle')}
            hint={t('admin.tile.settingsHint')}
          />
          <ActionTile
            to="/admin/team"
            icon="👥"
            title={t('admin.tile.teamTitle')}
            hint={t('admin.tile.teamHint')}
          />
          {isSuperadmin ? (
            <ActionTile
              to="/admin/platform"
              icon="🌐"
              title={t('admin.tile.platformTitle')}
              hint={t('admin.tile.platformHint')}
            />
          ) : null}
        </div>

        {/* Компактний рядок статистики — без візуального шуму */}
        {!loading && items.length > 0 ? (
          <div className="flex items-center justify-around rounded-xl bg-slate-900/60 px-3 py-2 text-center text-[11px] text-slate-400 ring-1 ring-slate-800">
            <div>
              <span className="font-bold text-white">{items.length}</span> {t('admin.stats.items')}
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div>
              <span className="font-bold text-white">{categories.length}</span>{' '}
              {t('admin.stats.categories')}
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div>
              <span className="font-bold text-emerald-400">
                {items.filter((i) => i.is_available).length}
              </span>{' '}
              {t('admin.stats.available')}
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
