// إصلاح تسجيل الدخول وإنشاء الحساب في Mada
(function(){
  const $=id=>document.getElementById(id);
  const loginBtn=$('loginBtn');
  if(!loginBtn) return;

  function getClient(){
    if(!window.supabase||!window.MADA_SUPABASE_URL||!window.MADA_SUPABASE_KEY){
      throw new Error('تعذر الاتصال بقاعدة البيانات.');
    }
    return window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
  }
  function msg(text,ok=false){const el=$('authMsg');if(el){el.textContent=text;el.style.color=ok?'#16803c':'';}}

  let signupBtn=$('signupBtn');
  if(!signupBtn){
    signupBtn=document.createElement('button');signupBtn.id='signupBtn';signupBtn.type='button';signupBtn.textContent='إنشاء حساب جديد';
    signupBtn.style.cssText='background:#eef2ff;color:#4054d8;';loginBtn.insertAdjacentElement('afterend',signupBtn);
  }
  let resetBtn=$('resetPasswordBtn');
  if(!resetBtn){
    resetBtn=document.createElement('button');resetBtn.id='resetPasswordBtn';resetBtn.type='button';resetBtn.textContent='نسيت كلمة المرور؟';
    resetBtn.style.cssText='background:transparent;color:#667085;font-size:14px;';signupBtn.insertAdjacentElement('afterend',resetBtn);
  }

  loginBtn.textContent='دخول';
  loginBtn.onclick=async function(){
    const email=$('emailInput').value.trim(),password=$('passwordInput').value;
    if(!email||!email.includes('@')) return msg('اكتب بريدًا إلكترونيًا صحيحًا.');
    if(password.length<6) return msg('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
    loginBtn.disabled=true;loginBtn.textContent='جاري الدخول…';
    try{
      const {data,error}=await getClient().auth.signInWithPassword({email,password});
      if(error){
        if(/confirm|verified|not confirmed/i.test(error.message||'')) msg('البريد الإلكتروني غير مؤكد. افتح رسالة التأكيد ثم حاول مرة أخرى.');
        else if(/invalid login credentials/i.test(error.message||'')) msg('البريد أو كلمة المرور غير صحيحة.');
        else msg('تعذر تسجيل الدخول: '+(error.message||'خطأ غير معروف'));
        return;
      }
      if(!data.session) return msg('لم يتم إنشاء جلسة. حاول مرة أخرى.');
      msg('تم تسجيل الدخول بنجاح ✓',true);location.reload();
    }catch(e){msg(e.message||'حدث خطأ غير متوقع.');}
    finally{loginBtn.disabled=false;loginBtn.textContent='دخول';}
  };

  signupBtn.onclick=async function(){
    const name=$('nameInput').value.trim(),email=$('emailInput').value.trim(),password=$('passwordInput').value;
    if(!email||!email.includes('@')) return msg('اكتب بريدًا إلكترونيًا صحيحًا.');
    if(password.length<6) return msg('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
    signupBtn.disabled=true;signupBtn.textContent='جاري إنشاء الحساب…';
    try{
      const {data,error}=await getClient().auth.signUp({email,password,options:{data:{display_name:name||email.split('@')[0]}}});
      if(error) return msg('تعذر إنشاء الحساب: '+(error.message||'خطأ غير معروف'));
      if(data.session){msg('تم إنشاء الحساب وتسجيل الدخول ✓',true);location.reload();}
      else msg('تم إنشاء الحساب. افتح بريدك واضغط رابط التأكيد، ثم اضغط «دخول».',true);
    }catch(e){msg(e.message||'حدث خطأ أثناء إنشاء الحساب.');}
    finally{signupBtn.disabled=false;signupBtn.textContent='إنشاء حساب جديد';}
  };

  resetBtn.onclick=async function(){
    const email=$('emailInput').value.trim();
    if(!email||!email.includes('@')) return msg('اكتب بريدك الإلكتروني أولًا.');
    resetBtn.disabled=true;resetBtn.textContent='جاري الإرسال…';
    try{
      const {error}=await getClient().auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
      if(error) return msg('تعذر إرسال الرابط: '+error.message);
      msg('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك ✓',true);
    }catch(e){msg(e.message||'حدث خطأ.');}
    finally{resetBtn.disabled=false;resetBtn.textContent='نسيت كلمة المرور؟';}
  };
})();
