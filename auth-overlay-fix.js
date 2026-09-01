/* Mada: keep the login sheet completely closed while a valid session exists. */
(function(){
  const $=id=>document.getElementById(id);
  const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  let signedIn=false;
  function hideAuth(){
    const a=$('auth');
    if(!a)return;
    a.hidden=true;
    a.style.setProperty('display','none','important');
    a.setAttribute('aria-hidden','true');
    document.body.classList.remove('auth-sheet-open');
    const app=$('app');
    if(app)app.hidden=false;
  }
  function allowAuth(){
    const a=$('auth');
    if(!a)return;
    a.removeAttribute('aria-hidden');
    a.hidden=false;
    a.style.removeProperty('display');
  }
  async function check(){
    try{
      const s=sb();
      if(!s?.auth)return;
      const r=await s.auth.getSession();
      signedIn=!!r.data?.session;
      if(signedIn)hideAuth();
    }catch(e){}
  }
  function boot(){
    const s=sb();
    if(s?.auth?.onAuthStateChange){
      s.auth.onAuthStateChange(function(event,session){
        signedIn=!!session;
        if(signedIn)hideAuth();
        else if(event==='SIGNED_OUT')allowAuth();
      });
    }
    check();
    const a=$('auth');
    if(a){
      new MutationObserver(function(){if(signedIn)hideAuth()}).observe(a,{attributes:true,attributeFilter:['hidden','style','class','aria-hidden']});
    }
    setInterval(function(){if(signedIn)hideAuth()},1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
