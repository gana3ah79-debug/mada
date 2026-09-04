/* Mada final mobile login hotfix: handle touch/pointer events before other layers and use one guarded Supabase request. */
(function(){
  if(window.__madaLoginHotfix)return;
  window.__madaLoginHotfix=true;
  let busy=false;
  const msg=(t,err)=>{const e=document.getElementById('authMsg');if(e){e.textContent=t;e.style.color=err?'#dc2626':'#6b7280'}};
  const client=()=>window.sb||window.__madaAuthClient||(window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY?(window.__madaAuthClient=window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY)):null);
  async function login(){
    if(busy)return;
    const email=(document.getElementById('emailInput')?.value||'').trim();
    const password=document.getElementById('passwordInput')?.value||'';
    if(!email||!password){msg('يرجى إدخال البريد الإلكتروني وكلمة المرور',true);return}
    const c=client();if(!c){msg('تعذر الاتصال بخدمة الحسابات حالياً. حدّث الصفحة وحاول مرة أخرى.',true);return}
    busy=true;const b=document.getElementById('loginBtn');const old=b?.innerHTML;
    if(b){b.disabled=true;b.innerHTML='<span>جارٍ تسجيل الدخول…</span>'}
    msg('جارٍ التحقق من بيانات الدخول…');
    try{
      const r=await c.auth.signInWithPassword({email,password});
      if(r.error)throw r.error;
      const session=r.data?.session;
      if(!session?.user)throw new Error('لم يتم إنشاء جلسة دخول');
      window.sb=c;window.user=session.user;try{sessionStorage.setItem('mada_authenticated_once','1')}catch(e){}
      const a=document.getElementById('auth'),app=document.getElementById('app');if(a)a.hidden=true;if(app)app.hidden=false;
      msg('تم تسجيل الدخول بنجاح ✓');
      try{if(typeof window.loadProfile==='function')await window.loadProfile()}catch(e){console.warn(e)}
      try{if(typeof window.loadFeed==='function')await window.loadFeed()}catch(e){console.warn(e)}
      try{if(typeof window.madaRefreshSocialBadges==='function')await window.madaRefreshSocialBadges()}catch(e){}
    }catch(e){console.error('Mada final login',e);msg('فشل تسجيل الدخول: '+(e?.message||'تحقق من البريد وكلمة المرور'),true)}
    finally{busy=false;if(b){b.disabled=false;b.innerHTML=old||'<span>تسجيل الدخول</span><span class="arrow">←</span>'}}
  }
  function bind(){
    document.addEventListener('pointerup',function(ev){const b=ev.target?.closest?.('#loginBtn');if(!b)return;ev.preventDefault();ev.stopImmediatePropagation();login()},true);
    document.addEventListener('keydown',function(ev){if(ev.key==='Enter'&&document.activeElement?.id==='passwordInput'){ev.preventDefault();login()}},true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  window.madaFinalLogin=login;
})();
