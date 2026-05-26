import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';

// Vite base (/BotiLocal/) → Router basename (/BotiLocal). Без цього маршрути
// /menu/:slug, /admin/* не співпадуть, бо реальний URL — /BotiLocal/menu/paddys.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter basename={basename}>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
}
