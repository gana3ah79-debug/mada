/* Mada authentication: isolated controller for login, signup and password recovery. */
(function(){
  if(window.__madaAuthController)return;
  window.__madaAuthController=true;
  const $=id=>document.getElementById(id);
  let mode='login',busy=false;
  const message=(text,error=false)=>{const el=$('authMsg');if(el){el.textContent=text;el.style.color=error?'#dc2626':'#6b7280';}};
  const client=()=>window.sb||window.__madaAuthClient||(window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY?(window.__madaAuthClient=window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY)):null);
  function render(){
    const name=$('nameInput'),field=$('nameField'),loginBtn=$('loginBtn'),signupBtn=$('signupBtn');
    const signup=mode==='signup';
    if(field){field.hidden=!signup;field.style.display=signup?'':'none';field.style.pointerEvents=signup?'auto':'none';}
    if(name){name.hidden=!signup;name.required=signup;}
    if(loginBtn){loginBtn.innerHTML=signup?'<span>إنشاء الحساب</span><span class="arrow">✨</span>':'<span>تسجيل الدخول</span><span class="arrow">←</span>';loginBtn.disabled=busy;loginBtn.style.pointerEvents='auto';loginBtn.style.touchAction='manipulation';loginBtn.style.position='relative';loginBtn.style.zIndex='20';}
    if(signupBtn){signupBtn.textContent=signup?'العودة لتسجيل الدخول':'إنشاء حساب جديد ✨';signupBtn.style.pointerEvents='auto';signupBtn.style.touchAction='manipulation';signupBtn.style.position='relative';signupBtn.style.zIndex='20';}
    message(signup?'أدخل الاسم والبريد الإلكتروني وكلمة المرور لإنشاء حساب جديد.':'أدخل البريد الإلكتروني وكلمة المرور لتسجيل الدخول.');
  }
  async function finish(c,u){window.sb=c;window.user=u;window.__madaAuthClient=c;try{localStorage.setItem('mada_authenticated_once','1')}catch(e){};const a=$('auth'),app=$('app');if(a)a.hidden=true;if(app)app.hidden=false;try{if(typeof window.loadProfile==='function')await window.loadProfile()}catch(e){}try{if(typeof window.loadFeed==='function')await window.loadFeed()}catch(e){}try{if(typeof window.madaRefreshSocialBadges==='function')await window.madaRefreshSocialBadges()}catch(e){}}
  async function login(){
    if(busy)return;
    const email=($('emailInput')?.value||'').trim(),password=$('passwordInput')?.value||'';
    if(!email||!password){message('يرجى إدخال البريد الإلكتروني وكلمة المرور',true);return;}
    const c=client();if(!c){message('خدمة الحسابات غير جاهزة. حاول تحديث الصفحة.',true);return;}
    busy=true;render();message('جارٍ تسجيل الدخول…');
    try{const r=await c.auth.signInWithPassword({email,password});if(r.error)throw r.error;if(!r.data?.session?.user)throw new Error('لم يتم إنشاء جلسة دخول');await finish(c,r.data.session.user);}
    catch(e){console.error('Mada login',e);message('فشل تسجيل الدخول: '+(e?.message||'تحقق من البريد وكلمة المرور'),true);}
    finally{busy=false;render();}
  }
  async function signup(){
    if(busy)return;
    const name=($('nameInput')?.value||'').trim(),email=($('emailInput')?.value||'').trim(),password=$('passwordInput')?.value||'';
    if(!name){message('اكتب الاسم الكامل أولاً',true);$('nameInput')?.focus();return;}if(!email){message('اكتب البريد الإلكتروني أولاً',true);$('emailInput')?.focus();return;}if(password.length<6){message('كلمة المرور يجب أن تكون 6 أحرف على الأقل',true);$('passwordInput')?.focus();return;}
    const c=client();if(!c){message('خدمة الحسابات غير جاهزة. حاول تحديث الصفحة.',true);return;}
    busy=true;render();message('جارٍ إنشاء الحساب…');
    try{const r=await c.auth.signUp({email,password,options:{data:{display_name:name,full_name:name}}});if(r.error)throw r.error;if(r.data?.session?.user)await finish(c,r.data.session.user);else message('تم إنشاء الحساب. افتح بريدك واضغط رابط التأكيد، ثم سجّل الدخول.');}
    catch(e){console.error('Mada signup',e);message('تعذر إنشاء الحساب: '+(e?.message||'خطأ غير معروف'),true);}finally{busy=false;render();}
  }
  async function reset(){const email=($('emailInput')?.value||'').trim();if(!email){message('اكتب بريدك الإلكتروني أولاً',true);$('emailInput')?.focus();return;}const c=client();if(!c){message('خدمة الحسابات غير جاهزة. حاول تحديث الصفحة.',true);return;}try{const r=await c.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/reset-password.html'});if(r.error)throw r.error;message('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني ✓');}catch(e){console.error('Mada reset',e);message('تعذر إرسال رابط الاستعادة: '+(e?.message||'حاول مرة أخرى'),true);}}
  function handle(e){
    const t=e.target?.closest?.('#loginBtn,#signupBtn,#forgotPasswordBtn');if(!t)return;
    e.preventDefault();e.stopPropagation();
    if(t.id==='loginBtn')return mode==='login'?login():signup();
    if(t.id==='signupBtn'){mode=mode==='login'?'signup':'login';render();return;}
    reset();
  }
  function bind(){
    const loginBtn=$('loginBtn'),signupBtn=$('signupBtn');if(!loginBtn||!signupBtn)return false;
    loginBtn.onclick=handle;signupBtn.onclick=handle;$('forgotPasswordBtn')?.addEventListener('click',handle,{capture:false});
    $('passwordInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();mode==='login'?login():signup();}});
    render();return true;
  }
  window.handleLogin=login;window.handleSignUp=signup;window.handleResetPassword=reset;window.madaAuthFinal={login,signup,reset,setMode:m=>{mode=m==='signup'?'signup':'login';render();}};
  const boot=()=>{if(!bind())setTimeout(boot,100);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();