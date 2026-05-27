import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { AdminShell } from '../components/AdminShell';
import { usePlatform, type PlatformTenant } from '../hooks/usePlatform';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/shared/lib/supabase';

const ALL_LANGS = ['es', 'en', 'uk', 'ru', 'pl', 'ga', 'de'] as const;

export default function PlatformPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { tenants, loading, error, reload } = usePlatform();
  const [showCreate, setShowCreate] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (currentUser && currentUser.role !== 'superadmin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  async function handleDelete(tenantPlatform: PlatformTenant) {
    if (!confirm(`Delete ${tenantPlatform.name} (${tenantPlatform.slug}) and ALL its data?`)) return;
    const { error: err } = await supabase.rpc('delete_tenant_admin', {
      p_tenant_id: tenantPlatform.id,
    });
    if (err) setActionError(err.message);
    await reload();
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl space-y-5 p-4">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold">
            🌐 Platform
            <span className="ml-2 text-xs font-normal text-slate-400">
              {tenants.length} {tenants.length === 1 ? 'tenant' : 'tenants'}
            </span>
          </h1>
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-semibold text-white"
          >
            {showCreate ? t('common.cancel') : '＋ New tenant'}
          </button>
        </header>

        {showCreate ? (
          <CreateTenantForm
            onCreated={() => {
              setShowCreate(false);
              void reload();
            }}
            onError={setActionError}
          />
        ) : null}

        {actionError ? (
          <div className="rounded-xl bg-rose-900/40 p-3 text-sm text-rose-200">{actionError}</div>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-400">{t('common.loading')}</p>
        ) : error ? (
          <p className="text-sm text-rose-400">{error}</p>
        ) : (
          <ul className="space-y-2">
            {tenants.map((tn) => (
              <li
                key={tn.id}
                className="rounded-2xl bg-slate-900 p-3 ring-1 ring-slate-800"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{tn.name}</div>
                    <div className="text-xs font-mono text-slate-400">/menu/{tn.slug}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                      <span className="rounded bg-slate-800 px-1.5 py-0.5">
                        {tn.items_count} items
                      </span>
                      {tn.owner_email ? (
                        <span className="truncate">owner: {tn.owner_email}</span>
                      ) : (
                        <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-amber-300">
                          no owner
                        </span>
                      )}
                      {!tn.is_active ? (
                        <span className="rounded bg-rose-900/40 px-1.5 py-0.5 text-rose-300">
                          inactive
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    <a
                      href={`${import.meta.env.BASE_URL}menu/${tn.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-slate-800 px-2 py-1 text-center text-[11px] font-semibold"
                    >
                      ↗ Menu
                    </a>
                    <ProvisionOwner tenant={tn} onDone={reload} onError={setActionError} />
                    <button
                      type="button"
                      onClick={() => void handleDelete(tn)}
                      className="rounded-lg bg-rose-900/40 px-2 py-1 text-[11px] font-bold text-rose-300"
                    >
                      ✕ Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}

function CreateTenantForm({
  onCreated,
  onError,
}: {
  onCreated: () => void;
  onError: (msg: string) => void;
}) {
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [lang, setLang] = useState<(typeof ALL_LANGS)[number]>('es');
  const [currency, setCurrency] = useState('EUR');
  const [primary, setPrimary] = useState('#FF6B35');
  const [secondary, setSecondary] = useState('#1A1A2E');
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.rpc('create_tenant_admin', {
      p_slug: slug,
      p_name: name,
      p_default_language: lang,
      p_currency: currency,
      p_primary_color: primary,
      p_secondary_color: secondary,
    });
    setSaving(false);
    if (error) onError(error.message);
    else onCreated();
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800"
    >
      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
        New tenant
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[10px] text-slate-400">slug (URL)</span>
          <input
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="my-restaurant"
            pattern="[a-z0-9\-]+"
            className="w-full rounded-lg bg-slate-800 px-3 py-2 font-mono text-sm outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] text-slate-400">name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Restaurant"
            className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] text-slate-400">default language</span>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as (typeof ALL_LANGS)[number])}
            className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm outline-none"
          >
            {ALL_LANGS.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] text-slate-400">currency</span>
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={3}
            className="w-full rounded-lg bg-slate-800 px-3 py-2 font-mono text-sm outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] text-slate-400">primary</span>
          <input
            type="color"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            className="h-10 w-full rounded bg-slate-800"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] text-slate-400">secondary</span>
          <input
            type="color"
            value={secondary}
            onChange={(e) => setSecondary(e.target.value)}
            className="h-10 w-full rounded bg-slate-800"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-brand-primary py-2 font-semibold text-white disabled:opacity-50"
      >
        {saving ? 'Creating…' : 'Create tenant'}
      </button>
      <p className="text-[10px] leading-relaxed text-slate-500">
        Створить тенант + 4 базові категорії (starters/mains/desserts/drinks). Owner призначте
        окремо нижче — він має бути попередньо зареєстрований на /admin/login.
      </p>
    </form>
  );
}

function ProvisionOwner({
  tenant,
  onDone,
  onError,
}: {
  tenant: PlatformTenant;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!email) return;
    setSaving(true);
    const { error } = await supabase.rpc('provision_tenant_owner_admin', {
      p_tenant_id: tenant.id,
      p_email: email.trim().toLowerCase(),
    });
    setSaving(false);
    if (error) {
      if (error.message.includes('not_registered')) {
        onError(`${email} не зареєстрований. Хай зайде на /admin/login — потім спробуйте ще.`);
      } else {
        onError(error.message);
      }
      return;
    }
    setEmail('');
    setOpen(false);
    onDone();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-semibold"
      >
        👤 Owner
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="owner@email"
        className="w-32 rounded bg-slate-800 px-1.5 py-1 text-[10px] outline-none"
      />
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={saving}
          className="flex-1 rounded bg-brand-primary px-1.5 py-1 text-[10px] font-bold text-white disabled:opacity-50"
        >
          {saving ? '…' : 'Set'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 rounded bg-slate-800 px-1.5 py-1 text-[10px]"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
