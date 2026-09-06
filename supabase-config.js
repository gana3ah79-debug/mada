const SUPABASE_URL = 'https://eclnddvupggxyythtpkv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_FqI5heK77syr-3QHh2LPHg_E82vbq-0';
window.MADA_SUPABASE_URL = SUPABASE_URL;
window.MADA_SUPABASE_KEY = SUPABASE_PUBLISHABLE_KEY;
window.MADA_SUPABASE_CLIENT = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
(function(){
  function load(src,attr){if(document.querySelector('script['+attr+']'))return;const s=document.createElement('script');s.src=src;s.setAttribute(attr,'1');s.async=false;document.head.appendChild(s)}
  function loadCss(href,attr){if(document.querySelector('link['+attr+']'))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.setAttribute(attr,'1');document.head.appendChild(l)}
  loadCss('mada-light-surfaces-v1.css?v20260906-2','data-mada-light-surfaces-v1');
  loadCss('mada-messenger-v1.css?v20260906-10','data-mada-messenger-v1');
  load('mada-stories-reels-v2.js?v20260906-2','data-mada-stories-reels');
  load('mada-stories-v5.js?v20260906-1','data-mada-stories-v5');
  load('mada-reels-creator-v1.js?v20260906-1','data-mada-reels-creator');
  load('mada-reels-interactions-v1.js?v20260906-4','data-mada-reels-interactions');
  load('mada-bottom-nav-smart-v1.js?v20260906-1','data-mada-bottom-nav-smart');
  load('mada-reels-layout-v2.js?v20260906-1','data-mada-reels-layout');
  load('mada-reels-side-actions-v1.js?v20260906-1','data-mada-reels-side-actions');
  load('mada-reels-reaction-dock-v1.js?v20260906-2','data-mada-reels-reaction-dock');
  load('mada-reels-fullscreen-v1.js?v20260906-3','data-mada-reels-fullscreen');
  load('mada-reels-comments-v1.js?v20260906-3','data-mada-reels-comments');
  load('mada-reels-polish-v1.js?v20260906-1','data-mada-reels-polish');
  load('mada-reels-follow-stats-v1.js?v20260906-1','data-mada-reels-follow-stats');
  load('mada-reels-performance-v1.js?v20260906-1','data-mada-reels-performance');
  load('mada-reels-stage7-v1.js?v20260906-1','data-mada-reels-stage7');
  load('mada-reels-actions-fix-v1.js?v20260906-1','data-mada-reels-actions-fix');
  load('mada-reels-delete-v1.js?v20260906-1','data-mada-reels-delete');
  load('mada-reels-final-v1.js?v20260906-1','data-mada-reels-final');
  load('mada-social-center-v1.js?v20260906-1','data-mada-social-center');
  load('mada-stability-v1.js?v20260906-1','data-mada-stability');
  load('mada-comments-v1.js?v20260906-1','data-mada-comments-v1');
  load('mada-reels-comments-bridge-v1.js?v20260906-1','data-mada-reels-comments-bridge');
  load('mada-friends-v1.js?v20260906-1','data-mada-friends-v1');
  load('mada-messenger-v1.js?v20260906-10','data-mada-messenger-v1');
  load('mada-profile-photo-edit-v1.js?v20260906-2','data-mada-profile-photo-edit-v1');
})();