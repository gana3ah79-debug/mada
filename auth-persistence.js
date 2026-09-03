/* Mada auth persistence: session restore only. Navigation/back is handled centrally by app.js. */
(function(){
  async function restore(){
    try{
      const c=window.sb || (window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY
        ? window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY):null);
      if(!c)return null;
      const {data:{session}}=await c.auth.getSession();
      if(session){
        sessionStorage.setItem('mada_authenticated_once','1');
        const auth=document.getElementById('auth'),app=document.getElementById('app');
        if(auth)auth.hidden=true;
        if(app)app.hidden=false;
        window.user=session.user;
      }
      return session||null;
    }catch(e){console.warn('Mada auth restore',e);return null}
  }
  async function init(){await restore();setTimeout(restore,500);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.madaAuthPersistence={restore};
})();
