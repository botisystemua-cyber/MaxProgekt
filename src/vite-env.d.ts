/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Runtime config, що його CI inлайнить у config.js.
interface Window {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}
