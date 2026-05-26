import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language, Tenant } from '@/shared/types/database';

interface AppState {
  // Активний тенант — заповнюється на /menu/:slug.
  tenant: Tenant | null;
  setTenant: (tenant: Tenant | null) => void;

  // Поточна мова контенту (вибрана юзером на публічному меню).
  // Зберігається в localStorage, щоб не скидалось між візитами.
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      tenant: null,
      setTenant: (tenant) => set({ tenant }),
      language: 'es',
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'botilocal_app',
      partialize: (state) => ({ language: state.language }),
    },
  ),
);
