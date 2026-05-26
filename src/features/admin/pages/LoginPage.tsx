import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared/lib/supabase';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError(err.message);
    else navigate('/admin/dashboard', { replace: true });
  }

  return (
    <main className="flex min-h-full items-center justify-center bg-slate-950 p-6 text-slate-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-slate-900 p-6 shadow-xl"
      >
        <h1 className="mb-6 text-center text-2xl font-bold">BotiLocal</h1>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs text-slate-400">{t('admin.email')}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none ring-brand-primary focus:ring-2"
          />
        </label>

        <label className="mb-5 block">
          <span className="mb-1 block text-xs text-slate-400">{t('admin.password')}</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none ring-brand-primary focus:ring-2"
          />
        </label>

        {error ? <p className="mb-4 text-sm text-rose-400">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-primary py-2 font-semibold text-white disabled:opacity-50"
        >
          {loading ? t('common.loading') : t('admin.login')}
        </button>
      </form>
    </main>
  );
}
