import { useTranslation } from 'react-i18next';
import { AdminShell } from '../components/AdminShell';

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl p-5">
        <h1 className="mb-4 text-xl font-bold">{t('admin.settings')}</h1>
        <p className="rounded-xl bg-slate-800/50 p-4 text-sm">
          🚧 Заглушка налаштувань: лого, обкладинка, кольори, мови, контакти, QR-код.
        </p>
      </div>
    </AdminShell>
  );
}
