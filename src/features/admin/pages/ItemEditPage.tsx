import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminShell } from '../components/AdminShell';

export default function ItemEditPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const isNew = !id;

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl p-5">
        <Link to="/admin/menu" className="text-sm text-brand-primary">
          ← {t('common.back')}
        </Link>
        <h1 className="mb-4 mt-2 text-xl font-bold">
          {isNew ? t('admin.newItem') : `Edit ${id}`}
        </h1>
        <p className="rounded-xl bg-slate-800/50 p-4 text-sm">
          🚧 Заглушка форми страви: назва/опис на 4 мовах, ціна, фото, бейджі.
        </p>
      </div>
    </AdminShell>
  );
}
