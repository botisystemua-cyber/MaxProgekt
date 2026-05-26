import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ItemDetailPage() {
  const { slug, itemId } = useParams<{ slug: string; itemId: string }>();
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col p-5">
      <Link to={`/menu/${slug}`} className="text-sm text-brand-primary">
        ← {t('common.back')}
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Item {itemId}</h1>
      <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        🚧 Заглушка деталей страви. Велике фото, опис, алергени, калорії — далі.
      </p>
    </main>
  );
}
