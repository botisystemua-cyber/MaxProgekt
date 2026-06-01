import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminShell } from '../components/AdminShell';

export default function OrdersPage() {
  const { t } = useTranslation();

  const features = [
    { icon: '📲', text: t('admin.orders.featureIntake') },
    { icon: '🔄', text: t('admin.orders.featureStatus') },
    { icon: '📊', text: t('admin.orders.featureAnalytics') },
    { icon: '🧾', text: t('admin.orders.featureHistory') },
  ];

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <Link to="/admin/dashboard" className="text-sm text-brand-primary">
          ← {t('common.back')}
        </Link>
        <h1 className="text-xl font-bold">{t('admin.tile.ordersTitle')}</h1>

        <div className="rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 p-6 ring-1 ring-amber-500/20">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300">
            ⏳ {t('admin.orders.comingSoon')}
          </div>
          <h2 className="text-lg font-bold text-white">{t('admin.orders.heroTitle')}</h2>
          <p className="mt-1 text-sm text-slate-300">{t('admin.orders.heroDesc')}</p>
        </div>

        <ul className="grid gap-2">
          {features.map((f) => (
            <li
              key={f.text}
              className="flex items-start gap-3 rounded-xl bg-slate-900 p-3 ring-1 ring-slate-800"
            >
              <span className="text-xl leading-none">{f.icon}</span>
              <span className="text-sm text-slate-200">{f.text}</span>
            </li>
          ))}
        </ul>

        <p className="text-center text-[11px] text-slate-500">{t('admin.orders.footer')}</p>
      </div>
    </AdminShell>
  );
}
