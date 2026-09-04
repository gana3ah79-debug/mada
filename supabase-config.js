window.MADA_SUPABASE_URL='https://eclnddvupggxyythtpkv.supabase.co';
window.MADA_SUPABASE_KEY='sb_publishable_FqI5heK77syr-3QHh2LPHg_E82vbq-0';

/* One durable Supabase auth configuration. Keep Supabase's default storage key so all Mada clients share the same session. */
(function(){
  if(window.supabase?.createClient && !window.__madaCreateClientPatched){
    const original=window.supabase.createClient.bind(window.supabase);
    window.supabase.createClient=function(url,key,options={}){
      options=Object.assign({},options,{auth:Object.assign({persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage},options.auth||{})});
      return original(url,key,options);
    };
    window.__madaCreateClientPatched=true;
  }
})();

(function(){
  if(document.querySelector('script[data-mada-auth-stability]'))return;
  const s=document.createElement('script');
  s.src='auth-stability-fix.js?v=20260903-01';
  s.async=false;
  s.dataset.madaAuthStability='1';
  document.head.appendChild(s);
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
(function(){const css=document.createElement('link');css.rel='stylesheet';css.href='post-reactions-enhance.css?v=20260903-02';document.head.appendChild(css);const s=document.createElement('script');s.src='post-reactions-enhance.js?v=20260903-02';s.async=false;document.head.appendChild(s)})();
(function(){const css=document.createElement('link');css.rel='stylesheet';css.href='notifications-enhance.css?v=20260903-01';document.head.appendChild(css);const s=document.createElement('script');s.src='notifications-enhance.js?v=20260903-01';s.async=false;document.head.appendChild(s)})();
(function(){const s=document.createElement('script');s.src='share-button-fix.js?v=20260903-03';s.async=false;document.head.appendChild(s)})();
(function(){const css=document.createElement('link');css.rel='stylesheet';css.href='share-sheet-force.css?v=20260903-01';document.head.appendChild(css);const s=document.createElement('script');s.src='share-actions-fix.js?v=20260903-02';s.async=false;document.head.appendChild(s)})();
(function(){const css=document.createElement('link');css.rel='stylesheet';css.href='bottom-nav-scroll.css?v=20260903-01';css.dataset.madaBottomNav='1';document.head.appendChild(css);const s=document.createElement('script');s.src='bottom-nav-scroll.js?v=20260903-01';s.async=false;document.head.appendChild(s)})();

/* Fresh comments UI build: comments stay on the right; reactions stay on the left. */
(function(){
  const s=document.createElement('script');
  s.src='comments-modern.js?v=20260904-10';
  s.async=false;
  document.head.appendChild(s);
})();
(function(){
  const css=document.createElement('style');
  css.id='mada-comments-direction-fix';
  css.textContent=`
    #madaCommentsOverlay .mada-comment-row{direction:rtl!important;display:flex!important;flex-direction:row!important;align-items:flex-start!important}
    #madaCommentsOverlay .mada-comment-avatar{order:0!important;flex:0 0 42px!important}
    #madaCommentsOverlay .mada-comment-main{order:1!important;align-items:flex-end!important;text-align:right!important}
    #madaCommentsOverlay .mada-comment-bubble{margin-left:0!important;margin-right:auto!important;text-align:right!important}
    #madaCommentsOverlay .mada-comment-tools{direction:ltr!important;display:flex!important;flex-direction:row!important;justify-content:space-between!important}
    #madaCommentsOverlay .mada-comment-like-wrap{order:1!important;margin-left:auto!important;margin-right:0!important}
    #madaCommentsOverlay .reply-comment{order:2!important}
    #madaCommentsOverlay .dots{order:3!important;margin-left:0!important;margin-right:auto!important}
    #madaCommentsOverlay .mada-reaction-picker{direction:ltr!important;left:-3px!important;right:auto!important}
  `;
  document.head.appendChild(css);
})();

document.addEventListener('click',function(e){
  if(e.target.closest?.('.mada-comments-close') || e.target.classList?.contains('mada-comments-overlay')) document.body.style.overflow='';
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape' && document.getElementById('madaCommentsOverlay') && !document.getElementById('madaCommentsOverlay').hidden) document.body.style.overflow='';
});
