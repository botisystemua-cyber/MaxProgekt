import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '@/features/auth/ProtectedRoute';

import MenuPage from '@/features/menu/pages/MenuPage';

import LoginPage from '@/features/admin/pages/LoginPage';
import DashboardPage from '@/features/admin/pages/DashboardPage';
import MenuManagePage from '@/features/admin/pages/MenuManagePage';
import ItemEditPage from '@/features/admin/pages/ItemEditPage';
import SpecialsPage from '@/features/admin/pages/SpecialsPage';
import SettingsPage from '@/features/admin/pages/SettingsPage';
import TeamPage from '@/features/admin/pages/TeamPage';
import PlatformPage from '@/features/admin/pages/PlatformPage';

export default function AppRouter() {
  return (
    <Routes>
      {/* Кореневий редірект — поки що демо-тенант. Пізніше landing. */}
      <Route path="/" element={<Navigate to="/menu/paddys" replace />} />

      {/* Публічне меню. Deep-link /item/:itemId відкриває модалку зверху того ж MenuPage. */}
      <Route path="/menu/:slug" element={<MenuPage />} />
      <Route path="/menu/:slug/item/:itemId" element={<MenuPage />} />

      {/* Адмін-панель */}
      <Route path="/admin/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<DashboardPage />} />
        <Route path="/admin/menu" element={<MenuManagePage />} />
        <Route path="/admin/menu/item/new" element={<ItemEditPage />} />
        <Route path="/admin/menu/item/:id" element={<ItemEditPage />} />
        <Route path="/admin/specials" element={<SpecialsPage />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
        <Route path="/admin/team" element={<TeamPage />} />
        <Route path="/admin/platform" element={<PlatformPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-slate-500">Page not found</p>
    </div>
  );
}
