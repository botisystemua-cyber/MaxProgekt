import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared/lib/supabase';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none ring-brand-primary focus:ring-2"
          />
        </label>

        <label className="mb-5 block">
          <span className="mb-1 block text-xs text-slate-400">{t('admin.password')}</span>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-800 px-3 py-2 pr-11 outline-none ring-brand-primary focus:ring-2"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-slate-100"
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M3 3l18 18M10.6 6.1A9.9 9.9 0 0 1 12 6c5 0 9.3 3.1 11 6-.6 1.1-1.5 2.2-2.6 3.2M6.6 6.6C4.4 8.1 2.8 10 2 12c1.7 2.9 6 6 10 6 1.8 0 3.5-.6 5-1.5M9.9 9.9a3 3 0 0 0 4.2 4.2"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
                </svg>
              )}
            </button>
          </div>
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
