// Mada auth controller: one source of truth for Supabase login.
(function(){
  const $=id=>document.getElementById(id);
  const btn=$('loginBtn');
  if(!btn) return;
  const setMsg=t=>{const m=$('authMsg');if(m)m.textContent=t||''};
  async function openApp(session){
    // Switch the UI immediately after Supabase confirms the credentials.
    // This avoids relying on a second startup path to hide the login screen.
    const auth=$('auth'), app=$('app');
    if(auth) auth.hidden=true;
    if(app) app.hidden=false;
    if(typeof start==='function'){
      try { await start(); } catch(e) { console.error('Mada start error:',e); }
    }
  }
  async function login(){
    const email=$('emailInput')?.value.trim();
    const password=$('passwordInput')?.value||'';
    if(!email)return setMsg('اكتب البريد الإلكتروني.');
    if(password.length<6)return setMsg('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
    btn.disabled=true;btn.textContent='جاري الدخول…';
    try{
      const {data,error}=await sb.auth.signInWithPassword({email,password});
      if(error){setMsg(error.message==='Invalid login credentials'?'البريد الإلكتروني أو كلمة المرور غير صحيحة.':'تعذر تسجيل الدخول: '+error.message);return;}
      if(!data?.session){setMsg('تم الدخول لكن لم يتم إنشاء جلسة.');return;}
      setMsg('تم تسجيل الدخول، جاري فتح Mada…');
      await openApp(data.session);
    }catch(e){setMsg(e?.message||'حدث خطأ غير متوقع.');}
    finally{btn.disabled=false;btn.textContent='دخول';}
  }
  async function register(){
    const name=$('nameInput')?.value.trim();
    const email=$('emailInput')?.value.trim();
    const password=$('passwordInput')?.value||'';
    if(!email)return setMsg('اكتب البريد الإلكتروني.');
    if(password.length<6)return setMsg('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
    try{
      const {data,error}=await sb.auth.signUp({email,password,options:{data:{display_name:name||email.split('@')[0]}}});
      if(error)return setMsg('تعذر إنشاء الحساب: '+error.message);
      if(data?.session){setMsg('تم إنشاء الحساب، جاري فتح Mada…');await openApp(data.session);}
      else setMsg('تم إنشاء الحساب. أكد بريدك الإلكتروني ثم اضغط دخول.');
    }catch(e){setMsg(e?.message||'حدث خطأ أثناء إنشاء الحساب.');}
  }
  btn.onclick=login;
  btn.textContent='دخول';
  if(!$('registerBtn')){
    const b=document.createElement('button');b.id='registerBtn';b.type='button';b.textContent='إنشاء حساب جديد';
    b.style.cssText='display:block;width:100%;margin:8px 0;padding:13px;border:0;border-radius:13px;font-size:16px;font-weight:700;';
    btn.parentNode.insertBefore(b,btn.nextSibling);b.onclick=register;
  }
})();
