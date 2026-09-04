window.MADA_SUPABASE_URL='https://eclnddvupggxyythtpkv.supabase.co';
window.MADA_SUPABASE_KEY='sb_publishable_FqI5heK77syr-3QHh2LPHg_E82vbq-0';
/* Brave/mobile browsers can occasionally block jsDelivr. Load a second official package mirror synchronously before auth/app boot. */
(function(){
  if(window.supabase?.createClient)return;
  const fallbacks=[
    'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js',
    'https://cdn.skypack.dev/@supabase/supabase-js@2'
  ];
  for(const src of fallbacks){
    if(window.supabase?.createClient)break;
    try{document.write('<script src="'+src+'"></script>')}catch(e){console.warn('Mada Supabase fallback',src,e)}
  }
})();
(function(){if(window.supabase?.createClient&&!window.__madaCreateClientPatched){const original=window.supabase.createClient.bind(window.supabase);window.supabase.createClient=function(url,key,options={}){options=Object.assign({},options,{auth:Object.assign({persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage},options.auth||{})});return original(url,key,options)};window.__madaCreateClientPatched=true}})();
/* Auth is intentionally booted before app.js so a broken feature script cannot disable the login screen. */
(function(){if(document.querySelector('script[data-mada-auth-early]'))return;document.write('<script src="auth-modern.js?v=20260904-16" data-mada-auth-early="1"></script>')})();
(function(){if(document.querySelector('link[data-mada-auth-shield-css]'))return;const c=document.createElement('link');c.rel='stylesheet';c.href='auth-click-shield.css?v=20260904-04';c.dataset.madaAuthShieldCss='1';document.head.appendChild(c);const s=document.createElement('script');s.src='auth-click-shield.js?v=20260904-04';s.async=false;s.dataset.madaAuthShield='1';document.head.appendChild(s)})();
(function(){if(document.querySelector('script[data-mada-startup-recovery]'))return;const s=document.createElement('script');s.src='startup-recovery.js?v=20260904-01';s.async=false;s.dataset.madaStartupRecovery='1';document.head.appendChild(s)})();
(function(){if(document.querySelector('script[data-mada-auth-stability]'))return;const s=document.createElement('script');s.src='auth-stability-fix.js?v=20260903-01';s.async=false;s.dataset.madaAuthStability='1';document.head.appendChild(s)})();
window.openMessages=window.openMessages||function(){if(typeof window.madaMessenger==='function')return window.madaMessenger();if(typeof window.showMessages==='function')return window.showMessages()};
(function(){if(document.querySelector('link[data-mada-home-feed]'))return;const css=document.createElement('link');css.rel='stylesheet';css.href='home-feed-enhance.css?v=20260903-01';css.dataset.madaHomeFeed='1';document.head.appendChild(css);const s=document.createElement('script');s.src='home-feed-enhance.js?v=20260903-01';s.async=false;document.head.appendChild(s)})();
(function(){const css=document.createElement('link');css.rel='stylesheet';css.href='post-reactions-enhance.css?v=20260903-02';document.head.appendChild(css);const s=document.createElement('script');s.src='post-reactions-enhance.js?v=20260903-02';s.async=false;document.head.appendChild(s)})();
(function(){const css=document.createElement('link');css.rel='stylesheet';css.href='notifications-enhance.css?v=20260903-01';document.head.appendChild(css);const s=document.createElement('script');s.src='notifications-enhance.js?v=20260903-01';s.async=false;document.head.appendChild(s)})();
(function(){const s=document.createElement('script');s.src='share-button-fix.js?v=20260903-03';s.async=false;document.head.appendChild(s)})();
(function(){const css=document.createElement('link');css.rel='stylesheet';css.href='share-sheet-force.css?v=20260903-01';document.head.appendChild(css);const s=document.createElement('script');s.src='share-actions-fix.js?v=20260903-02';s.async=false;document.head.appendChild(s)})();
(function(){const css=document.createElement('link');css.rel='stylesheet';css.href='bottom-nav-scroll.css?v=20260903-01';document.head.appendChild(css);const s=document.createElement('script');s.src='bottom-nav-scroll.js?v=20260903-01';s.async=false;document.head.appendChild(s)})();
(function(){if(document.querySelector('script[data-mada-comments-cleanup]'))return;const s=document.createElement('script');s.src='comments-ui-cleanup.js?v=20260903-01';s.async=false;s.dataset.madaCommentsCleanup='1';document.head.appendChild(s)})();
(function(){const s=document.createElement('script');s.src='comments-sheet-fix.js?v=20260904-07';s.async=false;document.head.appendChild(s)})();
(function(){const s=document.createElement('script');s.src='comments-send-final.js?v=20260904-02';s.async=false;document.head.appendChild(s)})();
(function(){const s=document.createElement('script');s.src='search-fix.js?v=20260904-02';s.async=false;document.head.appendChild(s)})();
(function(){if(document.querySelector('script[data-mada-back-guard]'))return;const s=document.createElement('script');s.src='back-guard-fix.js?v=20260904-01';s.async=false;s.dataset.madaBackGuard='1';document.head.appendChild(s)})();
(function(){const s=document.createElement('script');s.src='group-privacy-ui.js?v=20260904-01';s.async=false;s.dataset.madaGroupPrivacy='1';document.head.appendChild(s)})();
(function(){const s=document.createElement('script');s.src='reels-fix.js?v=20260904-02';s.async=false;s.dataset.madaReelUpload='1';document.head.appendChild(s)})();
(function(){if(document.querySelector('script[data-mada-top-nav-fix]'))return;const s=document.createElement('script');s.src='top-nav-fix.js?v=20260904-01';s.async=false;s.dataset.madaTopNavFix='1';document.head.appendChild(s)})();
