/* Mada publish/session guard. Prevents null-user crashes after transient auth state changes. */
(function(){
  async function getSession(){
    try{
      const c=window.sb;
      if(c?.auth){
        const r=await c.auth.getSession();
        return r?.data?.session||null;
      }
      if(window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY){
        const c2=window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
        const r=await c2.auth.getSession();
        return r?.data?.session||null;
      }
    }catch(e){console.warn('Mada session guard',e)}
    return null;
  }
  async function protectPublish(){
    const session=await getSession();
    if(!session?.user?.id){
      alert('انتهت جلسة الحساب أو لم يتم تحميلها بعد. أعد فتح Mada وسجّل الدخول مرة واحدة.');
      return false;
    }
    if(!window.user?.id){
      sessionStorage.setItem('mada_reload_after_auth','1');
      location.reload();
      return false;
    }
    return true;
  }
  function init(){
    const btn=document.getElementById('postBtn');
    if(!btn)return;
    const old=btn.onclick;
    btn.onclick=async function(e){
      if(!(await protectPublish()))return;
      if(typeof old==='function')return old.call(this,e);
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else setTimeout(init,0);
  window.madaProtectPublish=protectPublish;
})();
