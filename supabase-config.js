window.MADA_SUPABASE_URL='https://eclnddvupggxyythtpkv.supabase.co';
window.MADA_SUPABASE_KEY='sb_publishable_FqI5heK77syr-3QHh2LPHg_E82vbq-0';

// app.js references openMessages during initial script evaluation.
window.openMessages=window.openMessages||function(){
  if(typeof window.madaMessenger==='function') return window.madaMessenger();
  if(typeof window.showMessages==='function') return window.showMessages();
};

// Home feed enhancement.
(function(){
  if(document.querySelector('link[data-mada-home-feed]'))return;
  const css=document.createElement('link');css.rel='stylesheet';css.href='home-feed-enhance.css?v=20260903-01';css.dataset.madaHomeFeed='1';document.head.appendChild(css);
  const s=document.createElement('script');s.src='home-feed-enhance.js?v=20260903-01';s.async=false;document.head.appendChild(s);
})();

// Reaction enhancement.
(function(){
  const css=document.createElement('link');css.rel='stylesheet';css.href='post-reactions-enhance.css?v=20260903-02';document.head.appendChild(css);
  const s=document.createElement('script');s.src='post-reactions-enhance.js?v=20260903-02';s.async=false;document.head.appendChild(s);
})();

// Modern notification center: opens from the bell buttons, marks read, and refreshes the badge without reload.
(function(){
  const css=document.createElement('link');css.rel='stylesheet';css.href='notifications-enhance.css?v=20260903-01';document.head.appendChild(css);
  const s=document.createElement('script');s.src='notifications-enhance.js?v=20260903-01';s.async=false;document.head.appendChild(s);
})();

// Share button recovery: keep the مشاركة action visible after feed re-renders.
(function(){
  const s=document.createElement('script');s.src='share-button-fix.js?v=20260903-01';s.async=false;document.head.appendChild(s);
})();
