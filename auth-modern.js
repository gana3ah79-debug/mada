/* Mada authentication: single controller for login, signup and password recovery. */
(function(){
  if(window.__madaAuthController)return;
  window.__madaAuthController=true;
  const $=id=>document.getElementById(id);
  const message=(text,error=false)=>{const el=$('authMsg');if(el){el.textContent=text;el.style.color=error?'#dc2626':'#6b7280'}};
  const client=()=>window.sb||window.__madaAuthClient||(window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY?(window.__madaAuthClient=window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY)):null);
  let mode='login',busy=false;
  function render(){
    const name=$('nameInput'),nameField=$('nameField'),loginBtn=$('loginBtn'),signupBtn=$('signupBtn');
    const signupMode=mode==='signup';
    if(nameField){nameField.hidden=!signupMode;nameField.style.display=signupMode?'':'none';}
    if(name){name.hidden=!signupMode;name.required=signupMode;}
    if(loginBtn)loginBtn.innerHTML=signupMode?'<span>إنشاء الحساب</span><span class="arrow">✨</span>':'<span>تسجيل الدخول</span><span class="arrow">←</span>';
    if(signupBtn)signupBtn.textContent=signupMode?'العودة لتسجيل الدخول':'إنشاء حساب جديد ✨';
    message(signupMode?'أدخل الاسم والبريد الإلكتروني وكلمة المرور لإنشاء حساب جديد.':'أدخل البريد الإلكتروني وكلمة المرور لتسجيل الدخول.');
  }
  async function finish(c,u){
    window.sb=c;window.user=u;window.__madaAuthClient=c;
    try{localStorage.setItem('mada_authenticated_once','1')}catch(e){}
    const auth=$('auth'),app=$('app');if(auth)auth.hidden=true;if(app)app.hidden=false;
    try{if(typeof window.loadProfile==='function')await window.loadProfile()}catch(e){}
    try{if(typeof window.loadFeed==='function')await window.loadFeed()}catch(e){}
    try{if(typeof window.madaRefreshSocialBadges==='function')await window.madaRefreshSocialBadges()}catch(e){}
  }
  async function login(){
    if(busy)return;
    const email=($('emailInput')?.value||'').trim(),password=$('passwordInput')?.value||'';
    if(!email||!password){message('يرجى إدخال البريد الإلكتروني وكلمة المرور',true);return}
    const c=client();if(!c){message('خدمة الحسابات غير جاهزة. حدّث الصفحة وحاول مرة أخرى.',true);return}
    busy=true;const b=$('loginBtn');if(b){b.disabled=true;b.innerHTML='<span>جارٍ تسجيل الدخول…</span>'}message('جارٍ التحقق من بيانات الدخول…');
    try{const {data,error}=await c.auth.signInWithPassword({email,password});if(error)throw error;if(!data?.session?.user)throw new Error('لم يتم إنشاء جلسة دخول');await finish(c,data.session.user)}
    catch(e){console.error('Mada login',e);message('فشل تسجيل الدخول: '+(e?.message||'تحقق من البريد وكلمة المرور'),true)}
    finally{busy=false;if(b){b.disabled=false;render()}}
  }
  async function signup(){
    if(busy)return;
    const name=($('nameInput')?.value||'').trim(),email=($('emailInput')?.value||'').trim(),password=$('passwordInput')?.value||'';
    if(!name){message('اكتب الاسم الكامل أولاً',true);$('nameInput')?.focus();return}
    if(!email){message('اكتب البريد الإلكتروني أولاً',true);$('emailInput')?.focus();return}
    if(password.length<6){message('كلمة المرور يجب أن تكون 6 أحرف على الأقل',true);$('passwordInput')?.focus();return}
    const c=client();if(!c){message('خدمة الحسابات غير جاهزة. حدّث الصفحة وحاول مرة أخرى.',true);return}
    busy=true;const b=$('loginBtn');if(b){b.disabled=true;b.innerHTML='<span>جارٍ إنشاء الحساب…</span>'}message('جارٍ إنشاء الحساب…');
    try{const {data,error}=await c.auth.signUp({email,password,options:{data:{display_name:name,full_name:name}}});if(error)throw error;if(data?.session?.user){await finish(c,data.session.user)}else{message('تم إنشاء الحساب. افتح بريدك واضغط رابط التأكيد، ثم سجّل الدخول.')}}
    catch(e){console.error('Mada signup',e);message('تعذر إنشاء الحساب: '+(e?.message||'خطأ غير معروف'),true)}
    finally{busy=false;render()}
  }
  async function reset(){
    const email=($('emailInput')?.value||'').trim();if(!email){message('اكتب بريدك الإلكتروني أولاً',true);$('emailInput')?.focus();return}
    const c=client();if(!c){message('خدمة الحسابات غير جاهزة. حدّث الصفحة وحاول مرة أخرى.',true);return}
    try{const {error}=await c.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/reset-password.html'});if(error)throw error;message('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني ✓')}
    catch(e){console.error('Mada reset',e);message('تعذر إرسال رابط الاستعادة: '+(e?.message||'حاول مرة أخرى'),true)}
  }
  function installCapture(){
    if(window.__madaAuthCapture)return;window.__madaAuthCapture=true;
    const handler=e=>{
      const target=e.target?.closest?.('#loginBtn,#signupBtn,#forgotPasswordBtn');if(!target)return;
      e.preventDefault();e.stopImmediatePropagation();
      if(target.id==='loginBtn')return mode==='login'?login():signup();
      if(target.id==='signupBtn'){mode=mode==='login'?'signup':'login';render();return;}
      reset();
    };
    document.addEventListener('click',handler,true);
    document.addEventListener('pointerup',handler,true);
    document.addEventListener('touchend',handler,{capture:true,passive:false});
  }
  function bind(){
    const loginBtn=$('loginBtn'),signupBtn=$('signupBtn');if(!loginBtn||!signupBtn)return false;
    loginBtn.onclick=e=>{e.preventDefault();login()};
    signupBtn.onclick=e=>{e.preventDefault();mode=mode==='login'?'signup':'login';render()};
    $('passwordInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();mode==='login'?login():signup()}});
    const forgot=$('forgotPasswordBtn');if(forgot)forgot.onclick=e=>{e.preventDefault();reset()};
    render();return true;
  }
  function boot(){installCapture();if(bind())return;setTimeout(boot,200)}
  window.handleLogin=login;window.handleSignUp=signup;window.handleResetPassword=reset;
  window.madaAuthFinal={login,signup,reset,setMode:m=>{mode=m==='signup'?'signup':'login';render()}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
