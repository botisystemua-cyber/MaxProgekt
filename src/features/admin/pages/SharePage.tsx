import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminShell } from '../components/AdminShell';
import { MenuShareCard } from '../components/MenuShareCard';
import { useAdminTenant } from '../hooks/useAdminTenant';

export default function SharePage() {
  const { t } = useTranslation();
  const { tenant } = useAdminTenant();

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <Link to="/admin/dashboard" className="text-sm text-brand-primary">
          ← {t('common.back')}
        </Link>
        <h1 className="text-xl font-bold">{t('admin.tile.shareTitle')}</h1>

        {tenant ? (
          <MenuShareCard tenant={tenant} variant="full" />
        ) : (
          <div className="h-64 animate-pulse rounded-2xl bg-slate-900" />
        )}
      </div>
    </AdminShell>
  );
}
