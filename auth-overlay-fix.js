/* Mada: repair the auth sheet if another script leaves it empty/frozen. */
(function(){
  const $=id=>document.getElementById(id);
  const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  let signedIn=false;
  let repairing=false;
  function hideAuth(){
    const a=$('auth'); if(!a)return;
    a.hidden=true;
    a.style.setProperty('display','none','important');
    a.setAttribute('aria-hidden','true');
    document.body.classList.remove('auth-sheet-open');
    const app=$('app'); if(app)app.hidden=false;
  }
  function allowAuth(){
    const a=$('auth'); if(!a)return;
    a.removeAttribute('aria-hidden');
    a.hidden=false;
    a.style.setProperty('display','flex','important');
    document.body.classList.add('auth-sheet-open');
  }
  function repairEmptySheet(){
    if(repairing||signedIn)return;
    const a=$('auth'),c=a?.querySelector('.auth-card');
    if(!a||a.hidden||!c)return;
    const meaningful=[...c.children].filter(x=>!x.classList.contains('auth-sheet-close'));
    if(meaningful.length===0 && window.MadaAuth?.loginView){
      repairing=true;
      try{window.MadaAuth.loginView();}catch(e){console.warn('Mada auth repair',e)}
      setTimeout(()=>{repairing=false},100);
    }
  }
  async function check(){
    try{
      const s=sb(); if(!s?.auth)return;
      const r=await s.auth.getSession();
      signedIn=!!r.data?.session;
      if(signedIn)hideAuth(); else repairEmptySheet();
    }catch(e){repairEmptySheet()}
  }
  function boot(){
    const s=sb();
    if(s?.auth?.onAuthStateChange){
      s.auth.onAuthStateChange(function(event,session){
        signedIn=!!session;
        if(signedIn)hideAuth();
        else if(event==='SIGNED_OUT'){allowAuth();repairEmptySheet();}
      });
    }
    const a=$('auth');
    if(a)new MutationObserver(function(){
      if(signedIn)hideAuth(); else repairEmptySheet();
    }).observe(a,{attributes:true,childList:true,subtree:true,attributeFilter:['hidden','style','class','aria-hidden']});
    check();
    setTimeout(check,500);
    setTimeout(check,1500);
    setInterval(function(){if(signedIn)hideAuth();else repairEmptySheet()},1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
