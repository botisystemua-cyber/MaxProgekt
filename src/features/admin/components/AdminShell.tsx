import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Mobile-first каркас адмінки: контент + bottom navigation.
// Окремі сторінки рендеряться через <Outlet />, але поки що ми
// підключаємо AdminShell прямо у кожній page-заглушці — потім переїде в router.
interface Tab {
  to: string;
  labelKey: string;
  icon: string;
}

const tabs: Tab[] = [
  { to: '/admin/menu', labelKey: 'admin.menuManage', icon: '🍽️' },
  { to: '/admin/specials', labelKey: 'admin.specials', icon: '🔥' },
  { to: '/admin/settings', labelKey: 'admin.settings', icon: '⚙️' },
  { to: '/admin/team', labelKey: 'admin.team', icon: '👥' },
];

export function AdminShell({ children }: { children?: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-full flex-col bg-slate-950 text-slate-100">
      <main className="flex-1 overflow-y-auto pb-24">{children ?? <Outlet />}</main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-slate-800 bg-slate-900/95 backdrop-blur">
        <ul className="mx-auto grid max-w-3xl grid-cols-4">
          {tabs.map((tab) => (
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
