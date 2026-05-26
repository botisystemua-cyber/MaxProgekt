import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTenant } from '../hooks/useTenant';

// Заглушка публічного меню. Повна реалізація (категорії, картки, пошук,
// daily-special banner) — у наступних PR. Зараз цей файл тільки доводить,
// що ланцюжок маршрут → useTenant → Supabase працює.
export default function MenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { tenant, loading, error } = useTenant(slug);

  if (loading) {
    return <div className="p-6 text-center text-slate-500">{t('common.loading')}</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center text-rose-600">
        {t('common.error')}: {error.message}
      </div>
    );
  }

  if (!tenant) {
    return <div className="p-6 text-center text-slate-500">{t('menu.tenantNotFound')}</div>;
  }

  // Бренд-кольори тенанта пробрасуємо як CSS-змінні — Tailwind підхопить
  // через colors.brand.primary/secondary (див. tailwind.config.js).
  const style = {
    '--color-brand-primary': tenant.primary_color,
    '--color-brand-secondary': tenant.secondary_color,
  } as React.CSSProperties;

  return (
    <main style={style} className="mx-auto flex min-h-full max-w-3xl flex-col">
      <header
        className="safe-top px-5 pb-6 pt-4 text-white"
        style={{ backgroundColor: tenant.secondary_color }}
      >
        <h1 className="text-2xl font-bold">{tenant.name}</h1>
        {tenant.tagline ? (
          <p className="mt-1 text-sm text-white/70">{tenant.tagline}</p>
        ) : null}
      </header>

      <section className="flex-1 p-5">
        <p className="text-sm text-slate-500">
          {t('menu.title')} · /{tenant.slug}
        </p>
        <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          🚧 Це заглушка публічного меню. Категорії, страви, daily-special, пошук
          та перемикач мови з{`'`}являться у наступних PR.
        </p>
      </section>
    </main>
  );
}
