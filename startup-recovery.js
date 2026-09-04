/* Mada startup recovery: wait for a durable Supabase session and refill the feed after cold starts. */
(function(){
  let running=false, done=false;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  async function recover(){
    if(running||done)return;
    running=true;
    try{
      const sb=window.sb||(window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY?window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY):null);
      if(!sb)return;
      let session=null;
      for(let i=0;i<8;i++){
        try{session=(await sb.auth.getSession())?.data?.session||null}catch(e){}
        if(session)break;
        await sleep(350);
      }
      if(!session?.user)return;
      window.user=session.user;window.sb=sb;
      const auth=document.getElementById('auth'),app=document.getElementById('app');
      if(auth)auth.hidden=true;if(app)app.hidden=false;
      if(typeof window.loadProfile==='function')await window.loadProfile().catch(()=>{});
      const feed=document.getElementById('feed');
      const hasPosts=!!feed?.querySelector('article.post');
      if(!hasPosts&&typeof window.loadFeed==='function'){
        await window.loadFeed().catch(()=>{});
        if(!feed?.querySelector('article.post')&&typeof window.madaRestoreFeedSnapshot==='function')window.madaRestoreFeedSnapshot(true);
      }
      if(typeof window.loadNotificationCount==='function')window.loadNotificationCount().catch(()=>{});
      done=true;
    }finally{running=false}
  }
  function init(){setTimeout(recover,250);setTimeout(recover,1000);setTimeout(recover,2200);window.addEventListener('pageshow',()=>setTimeout(recover,300));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.madaStartupRecovery={recover};
})();
