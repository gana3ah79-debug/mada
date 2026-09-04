/* Mada unified authentication UI: one controller for login, signup and password reset. */
(function(){
  if(window.__madaAuthFinal)return;
  window.__madaAuthFinal=true;
  const $=id=>document.getElementById(id);
  const msg=(text,error=false)=>{const e=$('authMsg');if(e){e.textContent=text;e.style.color=error?'#dc2626':'#6b7280'}};
  const client=()=>window.sb||window.__madaAuthClient||(window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY?(window.__madaAuthClient=window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY)):null);
  function setMode(mode){
    const name=$('nameInput'),login=$('loginBtn'),signup=$('signupBtn');
    const signupMode=mode==='signup';
    if(name){name.style.display=signupMode?'block':'none';name.required=signupMode;name.setAttribute('aria-hidden',signupMode?'false':'true');}
    if(login){login.textContent=signupMode?'إنشاء الحساب ✨':'تسجيل الدخول ←';login.dataset.mode=signupMode?'signup':'login';}
    if(signup){signup.textContent=signupMode?'العودة لتسجيل الدخول':'إنشاء حساب جديد ✨';signup.dataset.mode=signupMode?'login':'signup';}
    msg(signupMode?'أدخل الاسم والبريد الإلكتروني وكلمة المرور لإنشاء حساب جديد.':'أدخل البريد الإلكتروني وكلمة المرور لتسجيل الدخول.');
  }
  async function finish(user,c){
    window.user=user;window.sb=c;window.__madaAuthClient=c;
    try{localStorage.setItem('mada_authenticated_once','1')}catch(e){}
    const a=$('auth'),app=$('app');if(a)a.hidden=true;if(app)app.hidden=false;
    try{if(typeof window.loadProfile==='function')await window.loadProfile()}catch(e){console.warn('Mada auth profile',e)}
    try{if(typeof window.loadFeed==='function')await window.loadFeed()}catch(e){console.warn('Mada auth feed',e)}
    try{if(typeof window.madaRefreshSocialBadges==='function')await window.madaRefreshSocialBadges()}catch(e){}
  }
  let busy=false;
  async function login(){
    if(busy)return;
    const email=($('emailInput')?.value||'').trim(),password=$('passwordInput')?.value||'';
    if(!email||!password){msg('يرجى إدخال البريد الإلكتروني وكلمة المرور',true);return}
    const c=client();if(!c){msg('تعذر الاتصال بخدمة الحسابات حالياً. حدّث الصفحة وحاول مرة أخرى.',true);return}
    busy=true;const b=$('loginBtn'),old=b?.innerHTML;if(b){b.disabled=true;b.innerHTML='<span>جارٍ تسجيل الدخول…</span>'}msg('جارٍ التحقق من بيانات الدخول…');
    try{const {data,error}=await c.auth.signInWithPassword({email,password});if(error)throw error;if(!data?.session?.user)throw new Error('لم يتم إنشاء جلسة دخول');await finish(data.session.user,c);msg('تم تسجيل الدخول بنجاح ✓')}
    catch(e){console.error('Mada unified login',e);msg('فشل تسجيل الدخول: '+(e?.message||'تحقق من البريد وكلمة المرور'),true)}
    finally{busy=false;if(b){b.disabled=false;b.innerHTML=old||'تسجيل الدخول ←'}}
  }
  async function signup(){
    if(busy)return;
    const name=($('nameInput')?.value||'').trim(),email=($('emailInput')?.value||'').trim(),password=$('passwordInput')?.value||'';
    if(!name){msg('اكتب الاسم الكامل أولاً',true);$('nameInput')?.focus();return}
    if(!email){msg('اكتب البريد الإلكتروني أولاً',true);$('emailInput')?.focus();return}
    if(!password){msg('اكتب كلمة المرور أولاً',true);$('passwordInput')?.focus();return}
    if(password.length<6){msg('كلمة المرور يجب أن تكون 6 أحرف على الأقل',true);$('passwordInput')?.focus();return}
    const c=client();if(!c){msg('تعذر الاتصال بخدمة الحسابات حالياً.',true);return}
    busy=true;const b=$('loginBtn'),old=b?.innerHTML;if(b){b.disabled=true;b.innerHTML='<span>جارٍ إنشاء الحساب…</span>'}msg('جارٍ إنشاء الحساب…');
    try{const {data,error}=await c.auth.signUp({email,password,options:{data:{display_name:name,full_name:name}}});if(error)throw error;if(data?.session?.user){await finish(data.session.user,c);msg('تم إنشاء الحساب وتسجيل الدخول ✓')}else msg('تم إنشاء الحساب. افتح بريدك واضغط رابط التأكيد ثم سجّل الدخول.')}catch(e){console.error('Mada unified signup',e);msg('تعذر إنشاء الحساب: '+(e?.message||'خطأ غير معروف'),true)}
    finally{busy=false;if(b){b.disabled=false;b.innerHTML=old||'إنشاء الحساب ✨'}}
  }
  async function reset(){
    const email=($('emailInput')?.value||'').trim();if(!email){msg('اكتب بريدك الإلكتروني أولاً لإرسال رابط الاستعادة.',true);$('emailInput')?.focus();return}
    const c=client();if(!c){msg('تعذر الاتصال بخدمة الحسابات حالياً.',true);return}
    try{const {error}=await c.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/reset-password.html'});if(error)throw error;msg('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني ✓')}catch(e){console.error('Mada unified reset',e);msg('تعذر إرسال رابط الاستعادة: '+(e?.message||'حاول مرة أخرى'),true)}
  }
  function bind(){
    const loginBtn=$('loginBtn'),signupBtn=$('signupBtn'),resetBtn=document.querySelector('.btn-text');
    if(!loginBtn||!signupBtn)return false;
    setMode('login');
    loginBtn.onclick=()=>login();
    signupBtn.onclick=()=>{if(loginBtn.dataset.mode==='login')setMode('signup');else setMode('login')};
    if(resetBtn)resetBtn.onclick=reset;
    $('passwordInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();if(loginBtn.dataset.mode==='signup')signup();else login()}});
    return true;
  }
  function boot(){if(bind())return;setTimeout(boot,200)}
  window.handleLogin=login;window.handleSignUp=signup;window.handleResetPassword=reset;window.madaAuthFinal={login,signup,reset,setMode};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
