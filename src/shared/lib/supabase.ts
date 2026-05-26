import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Конфіг шукаємо у двох місцях:
//   1. window.SUPABASE_URL / SUPABASE_ANON_KEY — inлайнить CI на etапі deploy.
//   2. import.meta.env.VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — для dev.
function readConfig(): { url: string; anonKey: string } {
  const url = window.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
  const anonKey = window.SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase config missing. Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ' +
        'у .env.local (dev) або через GitHub Secrets (prod, див. deploy-hostiq.yml).',
    );
  }

  return { url, anonKey };
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const { url, anonKey } = readConfig();
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

// Зручний alias для коду, що не очікує помилок конфігу до першого виклику.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return Reflect.get(getSupabase(), prop);
  },
});
