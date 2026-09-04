/* Mada feed rescue: ensure the home feed is populated after auth/app startup. */
(function(){
  'use strict';
  let lastRun=0;
  async function ensureFeed(){
    const app=document.getElementById('app');
    const feed=document.getElementById('feed');
    if(!app||app.hidden||!feed||typeof window.loadFeed!=='function') return;
    const now=Date.now();
    if(now-lastRun<3000) return;
    if(feed.querySelector('article.post')||feed.querySelector('.feed-skeleton')) return;
    lastRun=now;
    try{ await window.loadFeed(); }catch(e){ console.error('Mada feed rescue:',e); }
  }
  function boot(){
    [700,1800,3500,6000].forEach(ms=>setTimeout(ensureFeed,ms));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(ensureFeed,300);});
    window.addEventListener('pageshow',()=>setTimeout(ensureFeed,300),{passive:true});
    new MutationObserver(()=>ensureFeed()).observe(document.getElementById('app')||document.body,{attributes:true,attributeFilter:['hidden'],subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
