/* Mada login emergency bridge: guarantees the login button works on mobile/WebView even if another auth layer fails to bind. */
(function(){
  let busy=false;
  async function fallbackLogin(){
    const email=(document.getElementById('emailInput')?.value||'').trim();
    const password=document.getElementById('passwordInput')?.value||'';
    const msg=document.getElementById('authMsg');
    const btn=document.getElementById('loginBtn');
    const show=(t,err)=>{if(msg){msg.textContent=t;msg.style.color=err?'#dc2626':'#6b7280'}};
    if(!email||!password){show('يرجى إدخال البريد الإلكتروني وكلمة المرور',true);return;}
    if(busy)return;
    busy=true;
    if(btn){btn.disabled=true;btn.dataset.oldText=btn.innerHTML;btn.innerHTML='<span>جارٍ تسجيل الدخول…</span>'}
    try{
      const cfg=window.supabase;
      if(!cfg?.createClient||!window.MADA_SUPABASE_URL||!window.MADA_SUPABASE_KEY)throw new Error('تعذر الاتصال بخدمة الحسابات.');
      const client=window.sb||window.__madaAuthClient||cfg.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
      window.__madaAuthClient=client;
      const {data,error}=await client.auth.signInWithPassword({email,password});
      if(error)throw error;
      if(!data?.session?.user)throw new Error('لم يتم إنشاء جلسة دخول.');
      window.user=data.session.user;window.sb=client;
      try{sessionStorage.setItem('mada_authenticated_once','1')}catch(e){}
      const auth=document.getElementById('auth'),app=document.getElementById('app');
      if(auth)auth.hidden=true;if(app)app.hidden=false;
      show('تم تسجيل الدخول بنجاح ✓');
      try{if(typeof window.loadProfile==='function')await window.loadProfile()}catch(e){console.warn('Mada bridge profile',e)}
      try{if(typeof window.loadFeed==='function')await window.loadFeed()}catch(e){console.warn('Mada bridge feed',e)}
      try{if(typeof window.madaRefreshSocialBadges==='function')await window.madaRefreshSocialBadges()}catch(e){}
    }catch(e){console.error('Mada login bridge',e);show('فشل تسجيل الدخول: '+(e?.message||'تحقق من البريد وكلمة المرور'),true)}
    finally{busy=false;if(btn){btn.disabled=false;btn.innerHTML=btn.dataset.oldText||'<span>تسجيل الدخول</span><span class="arrow">←</span>'}}
  }
  function bind(){
    const btn=document.getElementById('loginBtn');
    if(!btn||btn.dataset.madaBridgeBound)return;
    btn.dataset.madaBridgeBound='1';
    btn.addEventListener('click',function(ev){
      ev.preventDefault();ev.stopImmediatePropagation();
      const fn=window.handleLogin;
      if(typeof fn==='function')Promise.resolve(fn()).catch(e=>console.error('Mada handleLogin',e));
      else fallbackLogin();
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  setTimeout(bind,500);setTimeout(bind,1500);
  window.madaLoginBridge={login:fallbackLogin};
})();
