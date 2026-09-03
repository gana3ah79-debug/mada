window.MADA_SUPABASE_URL='https://eclnddvupggxyythtpkv.supabase.co';
window.MADA_SUPABASE_KEY='sb_publishable_FqI5heK77syr-3QHh2LPHg_E82vbq-0';

// app.js references openMessages during initial script evaluation.
// Keep an early safe wrapper so the later Messenger module can take over at click time.
window.openMessages=window.openMessages||function(){
  if(typeof window.madaMessenger==='function') return window.madaMessenger();
  if(typeof window.showMessages==='function') return window.showMessages();
};
