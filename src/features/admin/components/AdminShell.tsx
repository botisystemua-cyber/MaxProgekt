import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthProvider';
import { useAdminTenant } from '../hooks/useAdminTenant';

interface Tab {
  to: string;
  labelKey: string;
  icon: string;
  superadminOnly?: boolean;
}

const allTabs: Tab[] = [
  { to: '/admin/dashboard', labelKey: 'admin.dashboardTab', icon: '📊' },
  { to: '/admin/menu', labelKey: 'admin.menuTab', icon: '🍽️' },
  { to: '/admin/team', labelKey: 'admin.teamTab', icon: '👥' },
  { to: '/admin/settings', labelKey: 'admin.settingsTab', icon: '⚙️' },
  { to: '/admin/platform', labelKey: 'admin.platformTab', icon: '🌐', superadminOnly: true },
];

export function AdminShell({ children }: { children?: React.ReactNode }) {
  const { t } = useTranslation();
  const { user, currentUser, currentUserLoading, signOut } = useAuth();
  const { tenant } = useAdminTenant();

  // Юзер залогінений, але без public.users-запису → корисний state-екран
  // з інструкцією, а не порожній admin. currentUserLoading охороняє від
  // короткочасного миготіння цього екрана поки триває fetch public.users.
  if (user && !currentUser && !currentUserLoading) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 bg-slate-950 p-6 text-center text-slate-100">
        <div className="text-5xl">🔐</div>
        <h1 className="text-xl font-bold">{t('admin.shell.notLinked')}</h1>
        <p className="max-w-sm text-sm text-slate-300">
          {t('admin.shell.notLinkedDesc', { email: user.email ?? '' })}
        </p>
        <button
          onClick={() => void signOut()}
          className="mt-2 rounded-lg bg-slate-800 px-4 py-2 text-sm"
        >
          {t('admin.logout')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-slate-950 text-slate-100">
      <header className="safe-top flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/60 px-4 py-3 backdrop-blur">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {t('admin.shell.brand')}
          </div>
          <div className="truncate text-sm font-semibold">
            {tenant?.name ?? '—'}{' '}
            {currentUser ? (
              <span className="ml-1 text-[10px] font-bold uppercase text-brand-primary">
                {currentUser.role}
              </span>
            ) : null}
          </div>
        </div>
        <button
          onClick={() => void signOut()}
          className="shrink-0 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold hover:bg-slate-700"
        >
          {t('admin.logout')}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">{children ?? <Outlet />}</main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-slate-800 bg-slate-900/95 backdrop-blur">
        <ul
          className={`mx-auto grid max-w-3xl ${
            currentUser?.role === 'superadmin' ? 'grid-cols-5' : 'grid-cols-4'
          }`}
        >
          {allTabs
            .filter((tab) => !tab.superadminOnly || currentUser?.role === 'superadmin')
            .map((tab) => (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                    isActive ? 'text-brand-primary' : 'text-slate-400'
                  }`
                }
              >
                <span className="text-xl leading-none">{tab.icon}</span>
                <span>{t(tab.labelKey)}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
