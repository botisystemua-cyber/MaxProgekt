import type { Role } from '@/shared/types/database';

// Усі sections адмінки. Імена збігаються з NavLink-шляхами без префікса /admin/.
export type Section =
  | 'dashboard'   // головна
  | 'menu'        // редагування меню
  | 'newItem'     // створення страви
  | 'orders'      // прийом замовлень (заглушка)
  | 'share'       // QR + кнопки шерингу
  | 'settings'    // бренд, мови, контакти
  | 'team'        // команда (тільки owner/superadmin)
  | 'platform';   // суперадмін: усі тенанти

// Чесний source of truth для permissions, щоб не плодити дублювання
// в AdminShell, Dashboard, ProtectedRoute, кожній сторінці.
const ALLOWED: Record<Role, ReadonlyArray<Section>> = {
  waiter:     ['dashboard', 'orders', 'share'],
  admin:      ['dashboard', 'menu', 'newItem', 'orders', 'share', 'settings'],
  owner:      ['dashboard', 'menu', 'newItem', 'orders', 'share', 'settings', 'team'],
  superadmin: ['dashboard', 'menu', 'newItem', 'orders', 'share', 'settings', 'team', 'platform'],
};

/** true якщо ця роль має доступ до секції. */
export function canAccess(role: Role | undefined | null, section: Section): boolean {
  if (!role) return false;
  return ALLOWED[role]?.includes(section) ?? false;
}

/** true якщо роль може додавати/видаляти/міняти команду (owner або superadmin). */
export function canManageTeam(role: Role | undefined | null): boolean {
  return role === 'owner' || role === 'superadmin';
}
