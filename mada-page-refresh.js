/* Mada Home Refresh Guard — clears stale UI state and reboots the existing app without duplicating handlers. */
(function(){
  'use strict';
  const KEY='mada-home-refresh-v1';
  function clearStaleHome(){
    try{
      sessionStorage.removeItem('mada-feed-loading');
      sessionStorage.removeItem('mada-home-loading');
    }catch(e){}
    const feed=document.getElementById('feed');
    if(feed){
      feed.removeAttribute('aria-busy');
      feed.classList.remove('loading','is-loading','frozen');
    }
    document.documentElement.classList.remove('loading','is-loading','frozen');
    document.body.classList.remove('loading','is-loading','frozen');
  }
  async function refresh(){
    clearStaleHome();
    const feed=document.getElementById('feed');
    if(feed)feed.innerHTML='<div class="card empty">جاري تحديث الصفحة الرئيسية…</div>';
    try{
      if(typeof window.loadFeed==='function'){
        await window.loadFeed(true);
      }else if(typeof window.madaReloadFeed==='function'){
        await window.madaReloadFeed();
      }
    }catch(e){
      if(feed)feed.innerHTML='<div class="card empty">تعذر تحديث المنشورات. حاول مرة أخرى.</div>';
    }
    try{window.dispatchEvent(new CustomEvent('mada:home-refreshed'));}catch(e){}
  }
  window.madaRefreshHome=refresh;
  window.MadaPageRefresh={refresh,clear:clearStaleHome};
  function install(){
    clearStaleHome();
    document.addEventListener('click',function(e){
      const b=e.target.closest('[data-mada-refresh],#refreshHome,#homeRefresh');
      if(!b)return;
      e.preventDefault();
      if(b.dataset.refreshing==='1')return;
      b.dataset.refreshing='1';
      Promise.resolve(refresh()).finally(()=>{b.dataset.refreshing='0'});
    },{passive:false});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
