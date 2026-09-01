// إصلاح تسجيل الدخول وإنشاء الحساب في Mada
(function(){
  const $=id=>document.getElementById(id);
  const sb=window.sb;
  if(!sb||!$('loginBtn')) return;

  const loginBtn=$('loginBtn');
  const card=loginBtn.parentElement;

  // فصل الدخول عن إنشاء الحساب حتى لا يتم إنشاء حساب جديد عند كتابة كلمة مرور خاطئة.
  loginBtn.textContent='دخول';

  let signupBtn=$('signupBtn');
  if(!signupBtn){
    signupBtn=document.createElement('button');
    signupBtn.id='signupBtn';
    signupBtn.type='button';
    signupBtn.textContent='إنشاء حساب جديد';
    signupBtn.style.cssText='background:#eef2ff;color:#4054d8;';
    loginBtn.insertAdjacentElement('afterend',signupBtn);
  }

  let resetBtn=$('resetPasswordBtn');
  if(!resetBtn){
    resetBtn=document.createElement('button');
    resetBtn.id='resetPasswordBtn';
    resetBtn.type='button';
    resetBtn.textContent='نسيت كلمة المرور؟';
    resetBtn.style.cssText='background:transparent;color:#667085;font-size:14px;';
    signupBtn.insertAdjacentElement('afterend',resetBtn);
  }

  function msg(text,ok=false){
    const el=$('authMsg');
    if(el){el.textContent=text;el.style.color=ok?'#16803c':'';}
  }

  loginBtn.onclick=async function(){
    const email=$('emailInput').value.trim();
    const password=$('passwordInput').value;
    if(!email||!email.includes('@')) return msg('اكتب بريدًا إلكترونيًا صحيحًا.');
    if(password.length<6) return msg('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');

    loginBtn.disabled=true;
    loginBtn.textContent='جاري الدخول…';
    const {data,error}=await sb.auth.signInWithPassword({email,password});
    loginBtn.disabled=false;
    loginBtn.textContent='دخول';

    if(error){
      console.error(error);
      if(/confirm|verified|not confirmed/i.test(error.message||'')){
        msg('البريد الإلكتروني غير مؤكد. افتح رسالة التأكيد ثم حاول مرة أخرى.');
      }else if(/invalid login credentials/i.test(error.message||'')){
        msg('البريد أو كلمة المرور غير صحيحة. لو نسيت كلمة المرور اضغط «نسيت كلمة المرور؟».');
      }else{
        msg('تعذر تسجيل الدخول: '+(error.message||'خطأ غير معروف'));
      }
      return;
    }

    msg('تم تسجيل الدخول بنجاح ✓',true);
    if(typeof window.start==='function') await window.start();
    else location.reload();
  };

  signupBtn.onclick=async function(){
    const name=$('nameInput').value.trim();
    const email=$('emailInput').value.trim();
    const password=$('passwordInput').value;
    if(!email||!email.includes('@')) return msg('اكتب بريدًا إلكترونيًا صحيحًا.');
    if(password.length<6) return msg('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');

    signupBtn.disabled=true;
    signupBtn.textContent='جاري إنشاء الحساب…';
    const {data,error}=await sb.auth.signUp({
      email,
      password,
      options:{data:{display_name:name||email.split('@')[0]}}
    });
    signupBtn.disabled=false;
    signupBtn.textContent='إنشاء حساب جديد';

    if(error){
      console.error(error);
      msg('تعذر إنشاء الحساب: '+(error.message||'خطأ غير معروف'));
      return;
    }

    if(data.session){
      msg('تم إنشاء الحساب وتسجيل الدخول ✓',true);
      if(typeof window.start==='function') await window.start();
      else location.reload();
    }else{
      msg('تم إنشاء الحساب. افتح بريدك واضغط رابط التأكيد، ثم ارجع واضغط «دخول».',true);
    }
  };

  resetBtn.onclick=async function(){
    const email=$('emailInput').value.trim();
    if(!email||!email.includes('@')) return msg('اكتب بريدك الإلكتروني أولًا.');
    resetBtn.disabled=true;
    resetBtn.textContent='جاري الإرسال…';
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
    resetBtn.disabled=false;
    resetBtn.textContent='نسيت كلمة المرور؟';
    if(error){msg('تعذر إرسال رابط إعادة التعيين: '+(error.message||''));return;}
    msg('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك ✓',true);
  };
})();
