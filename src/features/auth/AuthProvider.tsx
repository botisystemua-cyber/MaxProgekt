import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/shared/lib/supabase';
import type { AppUser } from '@/shared/types/database';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  // Запис з public.users (роль + tenant_id). null коли:
  //   - не залогінений
  //   - залогінений, але не приписаний до жодного тенанта
  currentUser: AppUser | null;
  loading: boolean;            // загальний auth.getSession()
  currentUserLoading: boolean; // окремий fetch public.users — щоб UI не
                               // мигав "Account not linked" поки в процесі
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserLoading, setCurrentUserLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Завантажуємо запис з public.users коли session з'являється/змінюється.
  useEffect(() => {
    if (!session?.user) {
      setCurrentUser(null);
      setCurrentUserLoading(false);
      return;
    }
    let cancelled = false;
    setCurrentUserLoading(true);
    supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setCurrentUser((data as AppUser | null) ?? null);
        setCurrentUserLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    currentUser,
    loading,
    currentUserLoading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
