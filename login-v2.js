// Mada login v3: authenticate then use the fixed data bootstrap.
(function(){
  const $=id=>document.getElementById(id), btn=$('loginBtn');
  if(!btn)return;
  const msg=t=>{const e=$('authMsg');if(e)e.textContent=t||''};
  async function login(){
    const email=$('emailInput')?.value.trim(),password=$('passwordInput')?.value||'';
    if(!email)return msg('اكتب البريد الإلكتروني.');
    if(password.length<6)return msg('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
    btn.disabled=true;btn.textContent='جاري الدخول…';
    try{
      const client=window.MADA_SUPABASE_CLIENT;
      if(!client)throw new Error('تعذر الاتصال بخدمة الحسابات.');
      const {data,error}=await client.auth.signInWithPassword({email,password});
      if(error)return msg(error.message==='Invalid login credentials'?'البريد الإلكتروني أو كلمة المرور غير صحيحة.':'تعذر تسجيل الدخول: '+error.message);
      if(!data?.session)return msg('تم الدخول لكن لم يتم إنشاء جلسة.');
      if(typeof window.madaStartFixed==='function')await window.madaStartFixed();
      msg('تم تسجيل الدخول بنجاح.');
    }catch(e){console.error(e);msg(e?.message||'حدث خطأ غير متوقع.');}
    finally{btn.disabled=false;btn.textContent='دخول';}
  }
  btn.onclick=login;
})();
