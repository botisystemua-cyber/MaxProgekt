import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthProvider';
import { AdminShell } from '../components/AdminShell';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl p-5">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{t('admin.dashboard')}</h1>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={() => void signOut()}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm"
          >
            {t('admin.logout')}
          </button>
        </header>

        <p className="rounded-xl bg-slate-800/50 p-4 text-sm">
          🚧 Заглушка дашборду. Тут буде статистика: перегляди меню, топ страв, активні акції.
        </p>
      </div>
    </AdminShell>
  );
}
