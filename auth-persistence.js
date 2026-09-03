/* Mada auth persistence + Android Back guard. */
(function(){
  let installed=false;
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
      }
      return session||null;
    }catch(e){console.warn('Mada auth restore',e);return null}
  }
  function guard(){
    if(installed)return;
    const app=document.getElementById('app');
    if(!app || app.hidden)return;
    installed=true;
    const mark={madaApp:true};
    try{
      if(!history.state?.madaApp){history.replaceState(mark,'',location.href);history.pushState(mark,'',location.href);}
    }catch(e){}
    window.addEventListener('popstate',function(){
      const modal=document.getElementById('modal');
      if(modal&&!modal.hidden){modal.hidden=true;history.pushState(mark,'',location.href);return;}
      history.pushState(mark,'',location.href);
    });
  }
  async function init(){
    const session=await restore();
    if(session)guard();
    setTimeout(async()=>{const s=await restore();if(s)guard();},500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.madaAuthPersistence={restore,guard};
})();
