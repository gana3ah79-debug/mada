/* Mada Home Stability v1 — safe performance bridge. */
(function(){'use strict';
  if(window.__MADA_HOME_STABILITY_V1)return;
  window.__MADA_HOME_STABILITY_V1=true;

  // mada-performance-v2.js is the optimized feed implementation.
  // Expose it through the legacy loadFeed name so older home modules
  // do not fall back to app.js's 50-post loader.
  function bridge(){
    if(typeof window.loadFeedPage==='function'){
      window.loadFeed=window.loadFeedPage;
      window.madaReloadFeed=window.madaReloadFeed||function(){return window.loadFeedPage(true)};
      return true;
    }
    return false;
  }

  function boot(){
    if(bridge()) return;
    let tries=0;
    const timer=setInterval(function(){
      if(bridge()||++tries>=30)clearInterval(timer);
    },250);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
