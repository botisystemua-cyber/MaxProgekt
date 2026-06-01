import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminShell } from '../components/AdminShell';
import { useTeam, type TeamMember } from '../hooks/useTeam';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/shared/lib/supabase';
import { canManageTeam } from '../lib/permissions';

type Role = 'owner' | 'admin' | 'waiter';

const roleBadge: Record<TeamMember['role'], { label: string; cls: string }> = {
  owner: { label: 'OWNER', cls: 'bg-brand-primary/20 text-brand-primary' },
  admin: { label: 'ADMIN', cls: 'bg-amber-900/40 text-amber-300' },
  waiter: { label: 'WAITER', cls: 'bg-slate-700 text-slate-200' },
  superadmin: { label: 'SUPERADMIN', cls: 'bg-rose-900/40 text-rose-300' },
};

export default function TeamPage() {
  const { t } = useTranslation();
  const { user, currentUser } = useAuth();
  const { members, loading, error, reload } = useTeam();
  const isOwner = canManageTeam(currentUser?.role);

  // Захист: admin/waiter не повинні бачити Team, навіть прямим лінком.
  // currentUser може бути null під час завантаження — тоді нічого не редіректимо.
  if (currentUser && !isOwner) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('waiter');
  const [adding, setAdding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [invite, setInvite] = useState<{
    email: string;
    role: Role;
    password: string;
    wasNew: boolean;
  } | null>(null);
  const [copied, setCopied] = useState<'url' | 'password' | 'all' | null>(null);

  const adminUrl = `${window.location.origin}${import.meta.env.BASE_URL}admin`;

  function generatePassword(): string {
    // Простий генератор: 10 символів alpha+digits. crypto API завжди є у браузерах.
    const chars = 'abcdefghijkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const out: string[] = [];
    const buf = new Uint32Array(10);
    crypto.getRandomValues(buf);
    for (let i = 0; i < buf.length; i++) {
      out.push(chars[buf[i] % chars.length]);
    }
    return out.join('');
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setActionError(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanPassword.length < 6) {
      setAdding(false);
      setActionError(t('admin.team.passwordTooShort'));
      return;
    }

    const { data, error: err } = await supabase.rpc('create_team_member', {
      p_email: cleanEmail,
      p_password: cleanPassword,
      p_role: role,
    });

    setAdding(false);
    if (err) {
      if (err.message.includes('forbidden')) {
        setActionError(t('admin.team.forbidden'));
      } else if (err.message.includes('invalid_email')) {
        setActionError(t('admin.team.invalidEmail'));
      } else if (err.message.includes('password_too_short')) {
        setActionError(t('admin.team.passwordTooShort'));
      } else {
        setActionError(err.message);
      }
      return;
    }

    // RPC повертає {user_id, was_new}. Якщо was_new=false — юзер уже існував,
    // ми лише перепризначили роль; пароль не оновлений → не світимо його в карті.
    const wasNew = (data as { was_new?: boolean } | null)?.was_new ?? false;
    setInvite({ email: cleanEmail, role, password: cleanPassword, wasNew });
    setEmail('');
    setPassword('');
    setRole('waiter');
    await reload();
  }

  function copy(text: string, kind: 'url' | 'password' | 'all') {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    });
  }

  async function handleRemove(m: TeamMember) {
    if (!confirm(t('admin.team.removeConfirm', { email: m.email }))) return;
    const { error: err } = await supabase.rpc('remove_team_member', { p_user_id: m.id });
    if (err) setActionError(err.message);
    await reload();
  }

  async function handleRoleChange(m: TeamMember, newRole: Role | 'owner') {
    const { error: err } = await supabase.rpc('change_team_role', {
      p_user_id: m.id,
      p_role: newRole,
    });
    if (err) setActionError(err.message);
    await reload();
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl space-y-5 p-4">
        <h1 className="text-xl font-bold">{t('admin.teamTab')}</h1>

        {invite ? (
          <div className="space-y-3 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-brand-primary/10 p-4 ring-1 ring-emerald-500/30">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                  ✅ {t('admin.team.invite.added')}
                </div>
                <div className="mt-0.5 text-sm font-semibold text-white">
                  {invite.email} ·{' '}
                  <span className="text-[10px] uppercase text-amber-300">{invite.role}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInvite(null)}
                aria-label={t('common.close', { defaultValue: 'Закрити' })}
                className="rounded-md bg-slate-800/60 px-2 py-1 text-xs text-slate-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 rounded-xl bg-slate-900/70 p-3 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">{t('admin.team.invite.url')}</span>
                <span className="truncate font-mono text-slate-100">{adminUrl}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">{t('admin.team.invite.login')}</span>
                <span className="truncate font-mono text-slate-100">{invite.email}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">{t('admin.team.invite.password')}</span>
                <span className="text-right font-mono text-slate-100">
                  {invite.wasNew
                    ? invite.password
                    : t('admin.team.invite.passwordKeptExisting')}
                </span>
              </div>
            </div>

            {invite.wasNew ? (
              <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200 ring-1 ring-amber-500/20">
                ⚠️ {t('admin.team.invite.savePasswordWarning')}
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => copy(adminUrl, 'url')}
                className="rounded-lg bg-slate-800 px-2 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700"
              >
                {copied === 'url' ? '✓' : '🔗'} {t('admin.team.invite.copyUrl')}
              </button>
              <button
                type="button"
                onClick={() => copy(invite.password, 'password')}
                disabled={!invite.wasNew}
                className="rounded-lg bg-slate-800 px-2 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700 disabled:opacity-40"
              >
                {copied === 'password' ? '✓' : '🔑'} {t('admin.team.invite.copyPassword')}
              </button>
              <button
                type="button"
                onClick={() =>
                  copy(
                    invite.wasNew
                      ? t('admin.team.invite.message', {
                          url: adminUrl,
                          email: invite.email,
                          password: invite.password,
                        })
                      : t('admin.team.invite.messageExisting', {
                          url: adminUrl,
                          email: invite.email,
                        }),
                    'all',
                  )
                }
                className="rounded-lg bg-brand-primary px-2 py-2 text-xs font-semibold text-white"
              >
                {copied === 'all' ? '✓' : '📋'} {t('admin.team.invite.copyAll')}
              </button>
            </div>
          </div>
        ) : null}

        {isOwner ? (
          <form
            onSubmit={handleAdd}
            className="space-y-3 rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800"
          >
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {t('admin.team.addMember')}
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="worker@example.com"
              className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('admin.team.passwordPlaceholder')}
                className="w-full rounded-lg bg-slate-800 px-3 py-2 pr-20 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <div className="absolute right-1 top-1/2 flex -translate-y-1/2 gap-1">
                <button
                  type="button"
                  onClick={() => setPassword(generatePassword())}
                  title={t('admin.team.generatePassword')}
                  className="rounded-md bg-slate-700/60 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
                >
                  🎲
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  title={showPassword ? t('admin.hidePassword') : t('admin.showPassword')}
                  className="rounded-md bg-slate-700/60 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm outline-none"
            >
              <option value="waiter">{t('admin.team.roleWaiter')}</option>
              <option value="admin">{t('admin.team.roleAdmin')}</option>
              <option value="owner">{t('admin.team.roleOwner')}</option>
            </select>
            <button
              type="submit"
              disabled={adding}
              className="w-full rounded-lg bg-brand-primary py-2 font-semibold text-white disabled:opacity-50"
            >
              {adding ? t('common.loading') : `＋ ${t('common.add')}`}
            </button>
            <p className="text-[10px] leading-relaxed text-slate-500">{t('admin.team.hint')}</p>
          </form>
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
            {members.map((m) => {
              const isMe = m.id === user?.id;
              const badge = roleBadge[m.role];
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-2xl bg-slate-900 p-3 ring-1 ring-slate-800"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{m.email}</span>
                      {isMe ? (
                        <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                          {t('admin.team.you')}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5">
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {isOwner && !isMe && m.role !== 'superadmin' ? (
                    <>
                      <select
                        value={m.role}
                        onChange={(e) => void handleRoleChange(m, e.target.value as Role | 'owner')}
                        className="shrink-0 rounded-lg bg-slate-800 px-2 py-1 text-xs"
                      >
                        <option value="waiter">waiter</option>
                        <option value="admin">admin</option>
                        <option value="owner">owner</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => void handleRemove(m)}
                        aria-label={t('common.delete')}
                        className="shrink-0 rounded-lg bg-rose-900/40 px-2 py-1 text-xs font-bold text-rose-300"
                      >
                        ✕
                      </button>
                    </>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
