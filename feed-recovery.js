/* Mada feed recovery: keep the feed visible across app restarts and auth/network races. */
(function(){
  const KEY='mada_feed_cache_v1';
  const POS='mada_feed_scroll_v1';
  const $=id=>document.getElementById(id);
  let restoring=false;
  function authenticated(){return !!(window.user?.id);}
  function save(){
    const feed=$('feed');
    if(!feed||feed.children.length===0)return;
    const html=feed.innerHTML;
    if(!html||/جاري تحميل المنشورات|لا توجد منشورات/.test(html))return;
    try{
      localStorage.setItem(KEY,html);
      localStorage.setItem(POS,String(window.scrollY||0));
    }catch(e){console.warn('Mada feed cache save',e)}
  }
  function restore(){
    const feed=$('feed');
    if(!feed||restoring||feed.children.length)return false;
    let html='';
    try{html=localStorage.getItem(KEY)||''}catch(e){}
    if(!html)return false;
    restoring=true;
    try{
      feed.innerHTML=html;
      const y=Number(localStorage.getItem(POS)||0);
      setTimeout(()=>{if(y>0)window.scrollTo(0,y)},80);
    }catch(e){console.warn('Mada feed cache restore',e)}
    restoring=false;
    return true;
  }
  async function refresh(){
    if(!authenticated())return;
    try{
      if(typeof window.loadFeed==='function')await window.loadFeed();
      else if(typeof window.start==='function')await window.start();
    }catch(e){console.warn('Mada feed refresh',e);restore()}
  }
  function init(){
    const feed=$('feed');
    if(!feed)return;
    const observer=new MutationObserver(()=>{if(!restoring)save()});
    observer.observe(feed,{childList:true,subtree:true});
    window.addEventListener('beforeunload',save,{capture:true});
    window.addEventListener('pagehide',save,{capture:true});
    window.addEventListener('pageshow',async()=>{
      if(!authenticated())return;
      restore();
      setTimeout(async()=>{
        if(feed.children.length===0)await refresh();
        else if(typeof window.loadFeed==='function')await refresh();
      },350);
    });
    setTimeout(async()=>{
      if(!authenticated())return;
      restore();
      if(feed.children.length===0||/تعذر تحميل المنشورات/.test(feed.textContent||''))await refresh();
    },900);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.madaFeedRecovery={save,restore,refresh};
})();
