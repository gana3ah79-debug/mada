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

/* Fresh comments UI build: comments stay beside the avatar on the right; reactions stay on the left. */
(function(){
  const s=document.createElement('script');
  s.src='comments-modern.js?v=20260904-11';
  s.async=false;
  document.head.appendChild(s);
})();
(function(){
  const css=document.createElement('style');
  css.id='mada-comments-reference-layout';
  css.textContent=`
    /* Reference comments sheet: RTL, clean Facebook-like spacing */
    #madaCommentsOverlay .mada-comments-sheet{direction:rtl!important;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif!important;background:#fff!important;color:#050505!important;}
    #madaCommentsOverlay .mada-comments-summary{display:flex!important;justify-content:space-between!important;align-items:center!important;padding:12px 16px!important;border-bottom:1px solid #e4e6eb!important;font-size:14px!important;color:#65676b!important;}
    #madaCommentsOverlay .mada-comments-list{padding:0 16px 92px!important;overflow:auto!important;}
    #madaCommentsOverlay .mada-comment-row{display:flex!important;flex-direction:row!important;direction:rtl!important;align-items:flex-start!important;gap:10px!important;margin:14px 0 0!important;width:100%!important;}
    #madaCommentsOverlay .mada-comment-avatar{width:40px!important;height:40px!important;min-width:40px!important;flex:0 0 40px!important;border-radius:50%!important;object-fit:cover!important;order:0!important;}
    #madaCommentsOverlay .mada-comment-main{order:1!important;flex:1 1 auto!important;min-width:0!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;text-align:right!important;}
    #madaCommentsOverlay .mada-comment-bubble{display:block!important;width:fit-content!important;max-width:100%!important;margin:0!important;padding:8px 11px!important;background:#f0f2f5!important;border-radius:16px!important;text-align:right!important;overflow-wrap:anywhere!important;}
    #madaCommentsOverlay .mada-comment-name{font-size:13px!important;font-weight:700!important;margin:0 0 2px!important;color:#050505!important;}
    #madaCommentsOverlay .mada-comment-author{color:#1877f2!important;font-size:11px!important;font-weight:600!important;background:#e7f3ff!important;padding:2px 6px!important;border-radius:4px!important;margin-right:5px!important;}
    #madaCommentsOverlay .mada-comment-text{font-size:15px!important;line-height:1.35!important;margin:4px 0!important;color:#050505!important;}
    #madaCommentsOverlay .mada-comment-time{color:#65676b!important;font-size:12px!important;margin-top:3px!important;}
    #madaCommentsOverlay .mada-comment-tools{position:relative!important;width:100%!important;min-height:26px!important;margin-top:4px!important;padding:0!important;display:block!important;direction:ltr!important;}
    #madaCommentsOverlay .mada-comment-like-wrap{position:absolute!important;left:0!important;right:auto!important;top:0!important;display:inline-flex!important;align-items:center!important;gap:3px!important;order:initial!important;margin:0!important;}
    #madaCommentsOverlay .mada-comment-like{background:none!important;border:0!important;padding:0!important;font-size:20px!important;line-height:24px!important;color:#65676b!important;}
    #madaCommentsOverlay .mada-comment-like.liked{color:#1877f2!important}
    #madaCommentsOverlay .mada-comment-like-count{font-size:12px!important;color:#65676b!important;margin:0!important}
    #madaCommentsOverlay .reply-comment{position:absolute!important;left:50%!important;right:auto!important;top:1px!important;transform:translateX(-50%)!important;padding:0!important;background:none!important;border:0!important;color:#65676b!important;font-size:12px!important;font-weight:600!important;}
    #madaCommentsOverlay .dots{position:absolute!important;right:0!important;left:auto!important;top:0!important;padding:0!important;background:none!important;border:0!important;color:#65676b!important;font-size:17px!important;line-height:22px!important;}
    #madaCommentsOverlay .mada-reaction-picker{position:absolute!important;left:-3px!important;right:auto!important;bottom:30px!important;direction:ltr!important;display:flex!important;gap:2px!important;align-items:center!important;background:#fff!important;border:1px solid #e4e6eb!important;border-radius:26px!important;padding:7px 9px!important;box-shadow:0 5px 22px rgba(0,0,0,.2)!important;z-index:50!important;}
    #madaCommentsOverlay .mada-reaction-choice{width:33px!important;height:33px!important;padding:0!important;font-size:24px!important;line-height:31px!important;background:transparent!important;border:0!important;}
    #madaCommentsOverlay .mada-comment-compose{position:absolute!important;left:0!important;right:0!important;bottom:0!important;background:#fff!important;padding:10px 16px!important;border-top:1px solid #e4e6eb!important;display:flex!important;align-items:center!important;gap:7px!important;}
    #madaCommentsOverlay .mada-comment-compose input{width:100%!important;height:42px!important;background:#f0f2f5!important;border:0!important;border-radius:20px!important;padding:10px 16px!important;font-size:14px!important;box-sizing:border-box!important;outline:none!important;}
    @media(prefers-color-scheme:dark){#madaCommentsOverlay .mada-comments-sheet,#madaCommentsOverlay .mada-comments-summary,#madaCommentsOverlay .mada-comment-compose{background:#171d27!important;color:#f5f7fa!important}#madaCommentsOverlay .mada-comment-bubble{background:#252c37!important}#madaCommentsOverlay .mada-comment-name,#madaCommentsOverlay .mada-comment-text{color:#f5f7fa!important}#madaCommentsOverlay .mada-comment-time,#madaCommentsOverlay .mada-comment-tools button,#madaCommentsOverlay .mada-comment-like-count{color:#aab4c3!important}#madaCommentsOverlay .mada-comment-compose{border-color:#303846!important}#madaCommentsOverlay .mada-comment-compose input{background:#202731!important;color:#fff!important}}
  `;
  document.head.appendChild(css);
})();

document.addEventListener('click',function(e){if(e.target.closest?.('.mada-comments-close') || e.target.classList?.contains('mada-comments-overlay')) document.body.style.overflow='';});
document.addEventListener('keydown',function(e){if(e.key==='Escape' && document.getElementById('madaCommentsOverlay') && !document.getElementById('madaCommentsOverlay').hidden) document.body.style.overflow='';});
