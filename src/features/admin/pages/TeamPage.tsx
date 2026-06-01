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
  const [role, setRole] = useState<Role>('waiter');
  const [adding, setAdding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [invite, setInvite] = useState<{ email: string; role: Role } | null>(null);
  const [copied, setCopied] = useState<'url' | 'all' | null>(null);

  const adminUrl = `${window.location.origin}${import.meta.env.BASE_URL}admin`;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setActionError(null);
    const { error: err } = await supabase.rpc('add_team_member', {
      p_email: email.trim().toLowerCase(),
      p_role: role,
    });
    setAdding(false);
    if (err) {
      if (err.message.includes('not_registered')) {
        setActionError(t('admin.team.notRegistered', { email }));
      } else if (err.message.includes('forbidden')) {
        setActionError(t('admin.team.forbidden'));
      } else {
        setActionError(err.message);
      }
      return;
    }
    const addedEmail = email.trim().toLowerCase();
    setInvite({ email: addedEmail, role });
    setEmail('');
    setRole('waiter');
    await reload();
  }

  function copy(text: string, kind: 'url' | 'all') {
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
                <span className="text-right text-slate-300">{t('admin.team.invite.passwordValue')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => copy(adminUrl, 'url')}
                className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700"
              >
                {copied === 'url' ? '✓' : '🔗'} {t('admin.team.invite.copyUrl')}
              </button>
              <button
                type="button"
                onClick={() =>
                  copy(
                    t('admin.team.invite.message', { url: adminUrl, email: invite.email }),
                    'all',
                  )
                }
                className="rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white"
              >
                {copied === 'all' ? '✓' : '📋'} {t('admin.team.invite.copyAll')}
              </button>
            </div>

            <p className="text-[10px] leading-relaxed text-slate-500">
              {t('admin.team.invite.hint')}
            </p>
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
