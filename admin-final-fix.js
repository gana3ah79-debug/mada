/* Mada Admin final runtime guard: keep the dashboard usable on slow/mobile connections. */
(function(){
  const $=id=>document.getElementById(id);
  const client=()=>window.supabase?.createClient?.(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
  async function isAdmin(){
    const sb=client(); if(!sb)return false;
    const {data:{session}}=await sb.auth.getSession();
    if(!session)return false;
    const {data:p,error}=await sb.from('profiles').select('role,is_banned').eq('id',session.user.id).maybeSingle();
    return !error&&p?.role==='admin'&&!p?.is_banned;
  }
  function showError(e){const c=$('content');if(c)c.innerHTML='<div class="card"><h3>حدث خطأ في لوحة الإدارة</h3><p>'+String(e?.message||e||'خطأ غير معروف').replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))+'</p><button class="primary" id="adminRetry">إعادة المحاولة</button></div>';$('adminRetry')?.addEventListener('click',()=>location.reload());}
  function install(){
    document.querySelectorAll('#dash aside button').forEach(b=>{
      b.addEventListener('click',async e=>{
        if(!(await isAdmin())){e.preventDefault();e.stopImmediatePropagation();$('login').hidden=false;$('dash').hidden=true;return;}
      },true);
    });
    window.addEventListener('unhandledrejection',e=>{if($('dash')&&!$('dash').hidden)showError(e.reason)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
