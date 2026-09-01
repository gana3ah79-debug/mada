// Mada shared-client bridge.
// app.js historically created a second Supabase client. Reuse the already-configured
// client so auth state, storage and realtime all share one session.
(function(){
  if(!window.supabase || !window.MADA_SUPABASE_CLIENT) return;
  const shared=window.MADA_SUPABASE_CLIENT;
  window.supabase.createClient=function(){ return shared; };
})();
