// Mada login v4: authenticate, persist session, then reload into the authenticated app runtime.
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
      let result=await client.auth.signInWithPassword({email,password});
      if(result.error){
        return msg(result.error.message==='Invalid login credentials'?'البريد الإلكتروني أو كلمة المرور غير صحيحة.':'تعذر تسجيل الدخول: '+result.error.message);
      }
      const {data:{session}}=await client.auth.getSession();
      if(!session)return msg('لم يتم إنشاء جلسة الدخول.');
      msg('تم تسجيل الدخول. جاري فتح Mada…');
      // app.js keeps its own in-memory user variable. Reloading is intentional:
      // it makes app.js initialize from the persisted Supabase session instead of
      // leaving the UI on the login screen with a session owned by another handler.
      setTimeout(()=>location.reload(),150);
    }catch(e){console.error(e);msg(e?.message||'حدث خطأ غير متوقع.');btn.disabled=false;btn.textContent='دخول';}
  }
  btn.onclick=login;
})();