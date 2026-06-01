import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminShell } from '../components/AdminShell';
import { useAdminTenant } from '../hooks/useAdminTenant';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/shared/lib/supabase';
import { canAccess } from '../lib/permissions';
import type { Language, Tenant } from '@/shared/types/database';

const ALL_LANGS: Language[] = ['es', 'en', 'uk', 'ru', 'pl', 'ga', 'de'];

export default function SettingsPage() {
  const { t } = useTranslation();
  const { tenant } = useAdminTenant();
  const { currentUser } = useAuth();
  const [form, setForm] = useState<Partial<Tenant>>({});
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Заливаємо form тільки коли ID тенанта міняється — щоб refetch на ту ж
  // саму сутність не скидав незбережені правки.
  useEffect(() => {
    if (tenant && hydratedFor !== tenant.id) {
      setForm(tenant);
      setHydratedFor(tenant.id);
    }
  }, [tenant, hydratedFor]);

  function patch<K extends keyof Tenant>(key: K, value: Tenant[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleLang(lang: Language) {
    const current = form.available_languages ?? [];
    const next = current.includes(lang)
      ? current.filter((l) => l !== lang)
      : [...current, lang];
    patch('available_languages', next);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from('tenants')
      .update({
        name: form.name,
        tagline: form.tagline,
        description: form.description,
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        default_language: form.default_language,
        available_languages: form.available_languages,
        currency: form.currency,
        address: form.address,
        phone: form.phone,
        hours: form.hours,
        wifi: form.wifi,
        logo_url: form.logo_url,
        cover_image_url: form.cover_image_url,
      })
      .eq('id', tenant.id);
    setSaving(false);
    if (err) setError(err.message);
    else setSavedAt(new Date());
  }

  // Захист: waiter не повинен бачити налаштування навіть прямим лінком.
  if (currentUser && !canAccess(currentUser.role, 'settings')) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (!tenant) {
    return (
      <AdminShell>
        <div className="p-6 text-sm text-slate-400">{t('common.loading')}</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <form onSubmit={handleSave} className="mx-auto max-w-3xl space-y-5 p-4">
        <h1 className="text-xl font-bold">{t('admin.settingsTab')}</h1>

        {error ? (
          <div className="rounded-xl bg-rose-900/40 p-3 text-sm text-rose-200">{error}</div>
        ) : null}
        {savedAt ? (
          <div className="rounded-xl bg-emerald-900/40 p-3 text-sm text-emerald-200">
            {t('admin.settings.savedAt', { time: savedAt.toLocaleTimeString() })}
          </div>
        ) : null}

        {/* BRAND */}
        <fieldset className="space-y-3 rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
          <legend className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {t('admin.settings.brand')}
          </legend>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">{t('admin.settings.name')}</span>
            <input
              type="text"
              value={form.name ?? ''}
              onChange={(e) => patch('name', e.target.value)}
              className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">{t('admin.settings.tagline')}</span>
            <input
              type="text"
              value={form.tagline ?? ''}
              onChange={(e) => patch('tagline', e.target.value)}
              className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">{t('admin.settings.description')}</span>
            <textarea
              value={form.description ?? ''}
              onChange={(e) => patch('description', e.target.value)}
              rows={2}
              className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs text-slate-400">{t('admin.settings.primaryColor')}</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primary_color ?? '#FF6B35'}
                  onChange={(e) => patch('primary_color', e.target.value)}
                  className="h-9 w-12 rounded bg-slate-800"
                />
                <input
                  type="text"
                  value={form.primary_color ?? ''}
                  onChange={(e) => patch('primary_color', e.target.value)}
                  className="flex-1 rounded-lg bg-slate-800 px-3 py-2 font-mono text-xs outline-none"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-400">{t('admin.settings.secondaryColor')}</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.secondary_color ?? '#1A1A2E'}
                  onChange={(e) => patch('secondary_color', e.target.value)}
                  className="h-9 w-12 rounded bg-slate-800"
                />
                <input
                  type="text"
                  value={form.secondary_color ?? ''}
                  onChange={(e) => patch('secondary_color', e.target.value)}
                  className="flex-1 rounded-lg bg-slate-800 px-3 py-2 font-mono text-xs outline-none"
                />
              </div>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">{t('admin.settings.logoUrl')}</span>
            <input
              type="url"
              value={form.logo_url ?? ''}
              onChange={(e) => patch('logo_url', e.target.value || null)}
              className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">{t('admin.settings.coverUrl')}</span>
            <input
              type="url"
              value={form.cover_image_url ?? ''}
              onChange={(e) => patch('cover_image_url', e.target.value || null)}
              className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm outline-none"
            />
          </label>
        </fieldset>

        {/* LANGUAGES */}
        <fieldset className="space-y-3 rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
          <legend className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {t('admin.settings.languages')}
          </legend>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">{t('admin.settings.default')}</span>
            <select
              value={form.default_language ?? 'es'}
              onChange={(e) => patch('default_language', e.target.value as Language)}
              className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
            >
              {ALL_LANGS.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <div>
            <div className="mb-1 text-xs text-slate-400">{t('admin.settings.available')}</div>
            <div className="flex flex-wrap gap-1.5">
              {ALL_LANGS.map((lang) => {
                const on = (form.available_languages ?? []).includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLang(lang)}
                    className={`rounded-full px-3 py-1 text-xs font-mono font-bold uppercase ${
                      on ? 'bg-brand-primary text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>
        </fieldset>

        {/* CONTACT */}
        <fieldset className="space-y-3 rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
          <legend className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {t('admin.settings.contact')}
          </legend>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">{t('admin.settings.address')}</span>
            <input
              type="text"
              value={form.address ?? ''}
              onChange={(e) => patch('address', e.target.value)}
              className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs text-slate-400">{t('admin.settings.phone')}</span>
              <input
                type="tel"
                value={form.phone ?? ''}
                onChange={(e) => patch('phone', e.target.value)}
                className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-400">{t('admin.settings.hours')}</span>
              <input
                type="text"
                value={form.hours ?? ''}
                onChange={(e) => patch('hours', e.target.value)}
                className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-400">{t('admin.settings.wifi')}</span>
              <input
                type="text"
                value={form.wifi ?? ''}
                onChange={(e) => patch('wifi', e.target.value)}
                className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-400">{t('admin.settings.currency')}</span>
              <input
                type="text"
                maxLength={3}
                value={form.currency ?? 'EUR'}
                onChange={(e) => patch('currency', e.target.value.toUpperCase())}
                className="w-full rounded-lg bg-slate-800 px-3 py-2 font-mono outline-none"
              />
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl bg-brand-primary py-3 font-bold text-white shadow-raised disabled:opacity-50"
        >
          {saving ? t('common.loading') : t('common.save')}
        </button>
      </form>
    </AdminShell>
  );
}
