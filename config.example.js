// Copy to config.js for local/self-hosted deployment.
// The publishable Supabase key is safe for browser use when RLS is configured.
// NEVER put a Supabase secret/service-role key, payment secret, OTP, PIN, or bank password here.
window.MADA_CONFIG = {
  SUPABASE_URL: 'https://YOUR_PROJECT_REF.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'YOUR_PUBLISHABLE_KEY'
};
