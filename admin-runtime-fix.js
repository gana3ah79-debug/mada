/* Mada Admin hardening: never leave a blank dashboard and surface database failures. */
(function(){
  const $=id=>document.getElementById(id);
  function msg(text){const el=$('loginMsg');if(el)el.textContent=text;}
  async function sync(){
    try{
      const c=window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY
        ? window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY):null;
      if(!c)return;
      const {data:{session}}=await c.auth.getSession();
      if(!session){$('login').hidden=false;$('dash').hidden=true;return;}
      const {data:p,error}=await c.from('profiles').select('role,is_banned').eq('id',session.user.id).maybeSingle();
      if(error||!p||p.role!=='admin'||p.is_banned){$('login').hidden=false;$('dash').hidden=true;return;}
      $('login').hidden=true;$('dash').hidden=false;
      if(typeof window.tab==='function')window.tab('overview');
    }catch(e){console.warn('Mada admin sync',e);$('login').hidden=false;$('dash').hidden=true;msg('تعذر الاتصال بلوحة الإدارة حالياً. حاول مرة أخرى.');}
  }
  function install(){
    const login=$('loginBtn');
    login?.addEventListener('click',()=>{login.disabled=true;setTimeout(()=>login.disabled=false,1200)},{capture:true});
    $('p')?.addEventListener('keydown',e=>{if(e.key==='Enter')$('loginBtn')?.click()});
    window.addEventListener('pageshow',sync);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install();setTimeout(sync,250)});else{install();setTimeout(sync,250)}
})();
