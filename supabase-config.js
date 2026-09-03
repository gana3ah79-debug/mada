window.MADA_SUPABASE_URL='https://eclnddvupggxyythtpkv.supabase.co';
window.MADA_SUPABASE_KEY='sb_publishable_FqI5heK77syr-3QHh2LPHg_E82vbq-0';

/* Force one durable Supabase auth configuration for the whole app. */
(function(){
  if(window.supabase?.createClient && !window.__madaCreateClientPatched){
    const original=window.supabase.createClient.bind(window.supabase);
    window.supabase.createClient=function(url,key,options={}){
      options=Object.assign({},options,{auth:Object.assign({persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage,storageKey:'mada-auth-session'},options.auth||{})});
      return original(url,key,options);
    };
    window.__madaCreateClientPatched=true;
  }
})();

window.openMessages=window.openMessages||function(){
  if(typeof window.madaMessenger==='function') return window.madaMessenger();
  if(typeof window.showMessages==='function') return window.showMessages();
};

(function(){
  if(document.querySelector('link[data-mada-home-feed]'))return;
  const css=document.createElement('link');css.rel='stylesheet';css.href='home-feed-enhance.css?v=20260903-01';css.dataset.madaHomeFeed='1';document.head.appendChild(css);
  const s=document.createElement('script');s.src='home-feed-enhance.js?v=20260903-01';s.async=false;document.head.appendChild(s);
})();

(function(){
  const css=document.createElement('link');css.rel='stylesheet';css.href='post-reactions-enhance.css?v=20260903-02';document.head.appendChild(css);
  const s=document.createElement('script');s.src='post-reactions-enhance.js?v=20260903-02';s.async=false;document.head.appendChild(s);
})();

(function(){
  const css=document.createElement('link');css.rel='stylesheet';css.href='notifications-enhance.css?v=20260903-01';document.head.appendChild(css);
  const s=document.createElement('script');s.src='notifications-enhance.js?v=20260903-01';s.async=false;document.head.appendChild(s);
})();

(function(){
  const s=document.createElement('script');s.src='share-button-fix.js?v=20260903-03';s.async=false;document.head.appendChild(s);
})();

(function(){
  const css=document.createElement('link');css.rel='stylesheet';css.href='share-sheet-force.css?v=20260903-01';document.head.appendChild(css);
  const s=document.createElement('script');s.src='share-actions-fix.js?v=20260903-02';s.async=false;document.head.appendChild(s);
})();

(function(){
  const css=document.createElement('link');css.rel='stylesheet';css.href='bottom-nav-scroll.css?v=20260903-01';document.head.appendChild(css);
  const s=document.createElement('script');s.src='bottom-nav-scroll.js?v=20260903-01';s.async=false;document.head.appendChild(s);
})();
