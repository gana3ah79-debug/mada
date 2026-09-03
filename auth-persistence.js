/* Mada auth persistence + Android back protection. Keeps the Supabase session alive and prevents the hardware Back button from returning to the auth screen. */
(function(){
  const KEY='mada_app_history_guard_v1';
  function client(){return window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY?window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY):null}
  async function restore(){
    try{
      const c=client(); if(!c)return;
      const {data:{session}}=await c.auth.getSession();
      if(session){sessionStorage.setItem('mada_authenticated_once','1');}
    }catch(e){console.warn('Mada auth restore',e)}
  }
  function guard(){
    if(!document.getElementById('app'))return;
    if(sessionStorage.getItem(KEY)!=='1'){
      history.replaceState({madaApp:true},'',location.href);
      history.pushState({madaApp:true},'',location.href);
      sessionStorage.setItem(KEY,'1');
    }
    window.addEventListener('popstate',function(){
      const modal=document.getElementById('modal');
      if(modal&&!modal.hidden){modal.hidden=true;history.pushState({madaApp:true},'',location.href);return;}
      history.pushState({madaApp:true},'',location.href);
    });
  }
  function init(){restore();setTimeout(guard,700);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.madaAuthPersistence={restore,guard};
})();
