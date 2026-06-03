import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthProvider';
import { useAppStore } from '@/shared/stores/appStore';
import { useThemeStore } from '@/shared/stores/themeStore';
import type { Language } from '@/shared/types/database';
import { useAdminTenant } from '../hooks/useAdminTenant';
import { canAccess, type Section } from '../lib/permissions';

const ADMIN_LANGS: Array<{ code: Language; label: string }> = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'uk', label: 'UK' },
  { code: 'ru', label: 'RU' },
  { code: 'de', label: 'DE' },
  { code: 'pl', label: 'PL' },
  { code: 'ga', label: 'GA' },
];

interface Tab {
  to: string;
  labelKey: string;
  icon: string;
  section: Section;
}

// Порядок табів. Видимість визначається `canAccess(role, section)` —
// додав плитку Замовлення (waiter тільки її бачить) перед Меню.
const allTabs: Tab[] = [
  { to: '/admin/dashboard', labelKey: 'admin.dashboardTab', icon: '🏠', section: 'dashboard' },
  { to: '/admin/orders',    labelKey: 'admin.tile.ordersTitle', icon: '📋', section: 'orders' },
  { to: '/admin/menu',      labelKey: 'admin.menuTab', icon: '🍽️', section: 'menu' },
  { to: '/admin/team',      labelKey: 'admin.teamTab', icon: '👥', section: 'team' },
  { to: '/admin/settings',  labelKey: 'admin.settingsTab', icon: '⚙️', section: 'settings' },
  { to: '/admin/platform',  labelKey: 'admin.platformTab', icon: '🌐', section: 'platform' },
];

export function AdminShell({ children }: { children?: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const { user, currentUser, currentUserLoading, signOut } = useAuth();
  const { tenant } = useAdminTenant();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  function changeLanguage(lang: Language) {
    setLanguage(lang);
    void i18n.changeLanguage(lang);
  }

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
    <div className="flex min-h-full flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="safe-top flex items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
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
        <div className="flex shrink-0 items-center gap-2">
          <label className="sr-only" htmlFor="admin-lang-select">
            {t('admin.shell.changeLanguage', { defaultValue: 'Change language' })}
          </label>
          <select
            id="admin-lang-select"
            value={language}
            onChange={(e) => changeLanguage(e.target.value as Language)}
            translate="no"
            className="h-8 rounded-lg bg-slate-100 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary dark:bg-slate-800 dark:text-slate-200"
          >
            {ADMIN_LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t('admin.shell.themeLight') : t('admin.shell.themeDark')}
            title={theme === 'dark' ? t('admin.shell.themeLight') : t('admin.shell.themeDark')}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-base hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => void signOut()}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            {t('admin.logout')}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">{children ?? <Outlet />}</main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        {(() => {
          const visibleTabs = allTabs.filter((tab) => canAccess(currentUser?.role, tab.section));
          // Tailwind JIT не сканує динамічні class-стрічки, тому статичний map.
          const colsCls: Record<number, string> = {
            2: 'grid-cols-2',
            3: 'grid-cols-3',
            4: 'grid-cols-4',
            5: 'grid-cols-5',
            6: 'grid-cols-6',
          };
          const cols = colsCls[Math.min(Math.max(visibleTabs.length, 2), 6)] ?? 'grid-cols-6';
          return (
            <ul className={`mx-auto grid max-w-3xl ${cols}`}>
              {visibleTabs.map((tab) => (
                <li key={tab.to}>
                  <NavLink
                    to={tab.to}
                    className={({ isActive }) =>
                      `flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                        isActive ? 'text-brand-primary' : 'text-slate-500 dark:text-slate-400'
                      }`
                    }
                  >
                    <span className="text-xl leading-none">{tab.icon}</span>
                    <span>{t(tab.labelKey)}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          );
        })()}
      </nav>
    </div>
  );
}
