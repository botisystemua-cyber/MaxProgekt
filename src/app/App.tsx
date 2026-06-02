import { useEffect } from 'react';
import Providers from './providers';
import AppRouter from './router';
import { useThemeStore } from '@/shared/stores/themeStore';

export default function App() {
  const theme = useThemeStore((s) => s.theme);

  // Tailwind darkMode='class': додаємо/прибираємо `dark` на <html>.
  // За замовчуванням стартуємо у dark — це збігається з історичним
  // hardcoded стилем, тому існуючі сторінки без light-варіантів не ламаються.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}
