// Mada login v2: force the authenticated app view and use the existing shared client.
(function(){
  const $=id=>document.getElementById(id), btn=$('loginBtn');
  if(!btn) return;
  const msg=t=>{const e=$('authMsg');if(e)e.textContent=t||''};
  function showApp(){
    const a=$('auth'),p=$('app');
    if(a){a.hidden=true;a.style.setProperty('display','none','important');}
    if(p){p.hidden=false;p.style.setProperty('display','block','important');}
  }
  async function login(){
    const email=$('emailInput')?.value.trim(), password=$('passwordInput')?.value||'';
    if(!email)return msg('اكتب البريد الإلكتروني.');
    if(password.length<6)return msg('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
    btn.disabled=true;btn.textContent='جاري الدخول…';
    try{
      const client=window.MADA_SUPABASE_CLIENT||window.sb||window.supabase?.createClient?.(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
      if(!client)throw new Error('تعذر الاتصال بخدمة الحسابات.');
      const {data,error}=await client.auth.signInWithPassword({email,password});
      if(error) return msg(error.message==='Invalid login credentials'?'البريد الإلكتروني أو كلمة المرور غير صحيحة.':'تعذر تسجيل الدخول: '+error.message);
      if(!data?.session) return msg('تم الدخول لكن لم يتم إنشاء جلسة.');
      showApp();
      window.dispatchEvent(new CustomEvent('mada:logged-in',{detail:{session:data.session}}));
      if(typeof start==='function'){try{await start();}catch(e){console.error(e);}}
      showApp();
      msg('تم تسجيل الدخول بنجاح.');
    }catch(e){msg(e?.message||'حدث خطأ غير متوقع.');}
    finally{btn.disabled=false;btn.textContent='دخول';}
  }
  btn.onclick=login;
})();
