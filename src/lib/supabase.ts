import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { USE_MOCK } from './constants';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!USE_MOCK && (!url || !anonKey)) {
  console.error(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 없습니다. .env 를 확인하거나 VITE_USE_MOCK=true 로 실행하세요.',
  );
}

/** features/{name}/api.ts 에서만 import 할 것 (ESLint 규칙으로 강제) */
export const supabase: SupabaseClient = createClient(
  url ?? 'http://localhost:54321',
  anonKey ?? 'public-anon-key',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
);
