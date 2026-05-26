import { useTranslation } from 'react-i18next';
import { AdminShell } from '../components/AdminShell';

export default function TeamPage() {
  const { t } = useTranslation();
  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl p-5">
        <h1 className="mb-4 text-xl font-bold">{t('admin.team')}</h1>
        <p className="rounded-xl bg-slate-800/50 p-4 text-sm">
          🚧 Заглушка управління командою (owner / admin / waiter).
        </p>
      </div>
    </AdminShell>
  );
}
