const SUPABASE_URL = 'https://eclnddvupggxyythtpkv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_FqI5heK77syr-3QHh2LPHg_E82vbq-0';

// Names used by the Mada app
window.MADA_SUPABASE_URL = SUPABASE_URL;
window.MADA_SUPABASE_KEY = SUPABASE_PUBLISHABLE_KEY;
// Single shared browser client for auth/login diagnostics.
window.MADA_SUPABASE_CLIENT = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

// Stories + Reels are loaded here so the feature is always available on the main app,
// without requiring another manual script tag in the HTML shell.
(function loadMadaStoriesReels(){
  if(document.querySelector('script[data-mada-stories-reels]'))return;
  const s=document.createElement('script');
  s.src='mada-stories-reels-v2.js?v20260906-2';
  s.dataset.madaStoriesReels='1';
  s.async=false;
  document.head.appendChild(s);
})();
