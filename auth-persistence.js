/* Mada auth persistence: session restore only. Navigation/back is handled centrally by app.js. */
(function(){
  async function restore(){
    try{
      const c=window.sb || (window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY
        ? window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY):null);
      if(!c)return null;
      const {data:{session}}=await c.auth.getSession();
      if(session){sessionStorage.setItem('mada_authenticated_once','1');const auth=document.getElementById('auth'),app=document.getElementById('app');if(auth)auth.hidden=true;if(app)app.hidden=false;window.user=session.user;}
      return session||null;
    }catch(e){console.warn('Mada auth restore',e);return null}
  }
  function loadRuntimeLayers(){
    if(document.getElementById('profilePage')&&!document.querySelector('script[data-mada-profile-runtime]')){const s=document.createElement('script');s.src='profile-runtime-fix.js?v=20260903-01';s.async=false;s.dataset.madaProfileRuntime='1';document.body.appendChild(s)}
    if(document.getElementById('dash')&&!document.querySelector('script[data-mada-admin-runtime]')){const s=document.createElement('script');s.src='admin-runtime-fix.js?v=20260903-01';s.async=false;s.dataset.madaAdminRuntime='1';document.body.appendChild(s)}
  }
  async function init(){await restore();loadRuntimeLayers();setTimeout(restore,500);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.madaAuthPersistence={restore};
})();
