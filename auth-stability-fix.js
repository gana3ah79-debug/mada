/* Mada auth stability: recover transient Supabase session nulls. Navigation is handled by app.js. */
(function(){
  let recovering=false;
  async function getClient(){return window.sb || (window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY?window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY):null)}
  async function verifyAndRestore(){
    if(recovering)return null;recovering=true;
    try{const c=await getClient();if(!c)return null;const{data:{session}}=await c.auth.getSession();if(session){window.user=session.user;const a=document.getElementById('auth'),app=document.getElementById('app');if(a)a.hidden=true;if(app)app.hidden=false}return session||null}
    catch(e){console.warn('Mada auth stability',e);return null}finally{recovering=false}
  }
  function loadPageHardening(){
    if(document.getElementById('profilePage')&&!document.querySelector('script[data-mada-profile-runtime]')){const s=document.createElement('script');s.src='profile-runtime-fix.js?v=20260903-01';s.async=false;s.dataset.madaProfileRuntime='1';document.head.appendChild(s)}
    if(document.getElementById('dash')&&!document.querySelector('script[data-mada-admin-runtime]')){const s=document.createElement('script');s.src='admin-runtime-fix.js?v=20260903-01';s.async=false;s.dataset.madaAdminRuntime='1';document.head.appendChild(s)}
  }
  function init(){verifyAndRestore();setTimeout(verifyAndRestore,350);setTimeout(verifyAndRestore,1200);loadPageHardening();const c=window.sb;if(c?.auth?.onAuthStateChange){c.auth.onAuthStateChange((event,session)=>{if(session){window.user=session.user;const a=document.getElementById('auth'),app=document.getElementById('app');if(a)a.hidden=true;if(app)app.hidden=false;return}if(event==='SIGNED_OUT'){window.user=null;const a=document.getElementById('auth'),app=document.getElementById('app');if(a)a.hidden=false;if(app)app.hidden=true;return}setTimeout(verifyAndRestore,300);setTimeout(verifyAndRestore,1000)})}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.madaAuthStability={verifyAndRestore};
})();
