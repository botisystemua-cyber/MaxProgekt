import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Без цього логу розробник сидить перед порожнім меню і не розуміє
  // чому fetch не працює — createClient не кине помилку, а запити на undefined
  // URL проваляться мовчки в .catch.
  console.error('[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing — скопіюй .env.example в .env');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');
