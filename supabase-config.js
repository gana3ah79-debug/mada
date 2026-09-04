const SUPABASE_URL = 'https://eclnddvupggxyythtpkv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_FqI5heK77syr-3QHh2LPHg_E82vbq-0';

// Names used by the Mada app
window.MADA_SUPABASE_URL = SUPABASE_URL;
window.MADA_SUPABASE_KEY = SUPABASE_PUBLISHABLE_KEY;
// Single shared browser client for auth/login diagnostics.
window.MADA_SUPABASE_CLIENT = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
