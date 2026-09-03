/* Mada feed persistence: keep home posts after closing/reopening the app and while navigating. */
(function(){
  const KEY='mada-feed-snapshot-v2';
  const OLD='mada-feed-snapshot-v1';
  let timer=null, restoring=false;
  const feed=()=>document.getElementById('feed');
  function save(){
    const f=feed(); if(!f)return;
    const posts=f.querySelectorAll('article.post');
    if(!posts.length)return;
    try{
      localStorage.setItem(KEY,JSON.stringify({html:f.innerHTML,scrollY:window.scrollY||0,at:Date.now()}));
    }catch(e){console.warn('Mada feed cache save failed',e)}
  }
  function scheduleSave(){clearTimeout(timer);timer=setTimeout(save,250)}
  function readSnapshot(){
    try{
      let raw=localStorage.getItem(KEY);
      if(!raw)raw=localStorage.getItem(OLD);
      if(!raw)return null;
      const snap=JSON.parse(raw);
      return snap?.html? snap:null;
    }catch(e){return null}
  }
  function restore(force=false){
    const f=feed(); if(!f||restoring)return false;
    if(!force&&f.querySelector('article.post'))return false;
    const snap=readSnapshot(); if(!snap)return false;
    restoring=true;
    try{
      f.innerHTML=snap.html;
      requestAnimationFrame(()=>setTimeout(()=>window.scrollTo(0,Number(snap.scrollY)||0),40));
      return true;
    }catch(e){console.warn('Mada feed snapshot restore failed',e);return false}
    finally{restoring=false}
  }
  async function recoverIfEmpty(){
    const f=feed();if(!f)return;
    const text=f.textContent||'';
    if(!f.querySelector('article.post') || text.includes('تعذر تحميل المنشورات')){
      if(restore(true)){
        setTimeout(()=>{if(typeof window.madaFeedRecovery?.refresh==='function')window.madaFeedRecovery.refresh()},500);
      }
    }
  }
  function init(){
    const f=feed();if(!f)return;
    const observer=new MutationObserver(scheduleSave);
    observer.observe(f,{childList:true,subtree:true});
    window.addEventListener('pagehide',save,{capture:true});
    window.addEventListener('beforeunload',save,{capture:true});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save()});
    window.addEventListener('pageshow',()=>{setTimeout(()=>restore(false),120);setTimeout(recoverIfEmpty,1200)});
    setTimeout(()=>restore(false),500);
    setTimeout(recoverIfEmpty,1800);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.madaSaveFeedSnapshot=save;
  window.madaRestoreFeedSnapshot=restore;
})();
