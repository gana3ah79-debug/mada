/* Mada auth stability: recover from transient Supabase session nulls and protect Android Back. */
(function(){
  let lastUserId=null;
  let handling=false;

  function showApp(session){
    if(!session)return false;
    lastUserId=session.user.id;
    window.user=session.user;
    const auth=document.getElementById('auth'), app=document.getElementById('app');
    if(auth)auth.hidden=true;
    if(app)app.hidden=false;
    return true;
  }

  async function verifyAndRestore(){
    if(handling)return;
    handling=true;
    try{
      const c=window.sb || (window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY
        ? window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY):null);
      if(!c)return;
      const {data:{session}}=await c.auth.getSession();
      if(session){
        showApp(session);
        if(typeof window.start==='function' && !lastUserId) await window.start();
      }
    }catch(e){console.warn('Mada auth stability',e)}
    finally{handling=false}
  }

  function installBackGuard(){
    const app=document.getElementById('app');
    if(!app)return;
    const mark={madaApp:true};
    try{
      if(!history.state?.madaApp){history.replaceState(mark,'',location.href);history.pushState(mark,'',location.href);}
    }catch(e){}
    window.addEventListener('popstate',function(){
      const modal=document.getElementById('modal');
      if(modal&&!modal.hidden){modal.hidden=true;history.pushState(mark,'',location.href);return;}
      verifyAndRestore();
      history.pushState(mark,'',location.href);
    });
  }

  function init(){
    verifyAndRestore();
    setTimeout(verifyAndRestore,350);
    setTimeout(verifyAndRestore,1200);
    installBackGuard();
    if(window.sb?.auth?.onAuthStateChange){
      window.sb.auth.onAuthStateChange(function(event,session){
        if(session){showApp(session);return;}
        if(event==='SIGNED_OUT'){
          lastUserId=null;
          const auth=document.getElementById('auth'),app=document.getElementById('app');
          if(auth)auth.hidden=false;
          if(app)app.hidden=true;
          return;
        }
        setTimeout(verifyAndRestore,300);
        setTimeout(verifyAndRestore,1000);
      });
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
