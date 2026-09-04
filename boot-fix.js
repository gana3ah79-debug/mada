// Mada boot bridge: start the app after all scripts load and keep boot errors visible.
(function(){
  function boot(){
    try {
      if (typeof start === 'function') start();
      const adminBtn=document.getElementById('adminLoginBtn');
      if(adminBtn && typeof adminLogin==='function') adminBtn.onclick=adminLogin;
      const close=document.getElementById('closeModal');
      if(close && typeof closeModal==='function') close.onclick=closeModal;
    } catch(e) {
      const msg=document.getElementById('authMsg');
      if(msg) msg.textContent='خطأ في تشغيل التطبيق: '+(e?.message||e);
      console.error(e);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
