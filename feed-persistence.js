/* Mada feed persistence: keep home posts and scroll position while navigating. */
(function(){
  const KEY='mada-feed-snapshot-v1';
  let timer=null;
  function feed(){return document.getElementById('feed');}
  function save(){
    const f=feed();
    if(!f)return;
    const posts=f.querySelectorAll('article.post');
    if(!posts.length)return;
    try{
      sessionStorage.setItem(KEY,JSON.stringify({html:f.innerHTML,scrollY:window.scrollY||0,at:Date.now()}));
    }catch(e){console.warn('Mada feed snapshot save failed',e)}
  }
  function scheduleSave(){clearTimeout(timer);timer=setTimeout(save,350)}
  function restore(){
    const f=feed();
    if(!f||f.querySelector('article.post'))return false;
    try{
      const raw=sessionStorage.getItem(KEY);if(!raw)return false;
      const snap=JSON.parse(raw);
      if(!snap?.html)return false;
      f.innerHTML=snap.html;
      requestAnimationFrame(()=>setTimeout(()=>window.scrollTo(0,Number(snap.scrollY)||0),30));
      return true;
    }catch(e){console.warn('Mada feed snapshot restore failed',e);return false}
  }
  function init(){
    const f=feed();if(!f)return;
    const observer=new MutationObserver(scheduleSave);
    observer.observe(f,{childList:true,subtree:true});
    window.addEventListener('pagehide',save);
    window.addEventListener('beforeunload',save);
    window.addEventListener('pageshow',()=>setTimeout(restore,120));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save()});
    setTimeout(restore,700);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.madaSaveFeedSnapshot=save;
  window.madaRestoreFeedSnapshot=restore;
})();
