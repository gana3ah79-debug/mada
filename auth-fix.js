/* Mada login fix - independent of app.js */
(function(){
  function show(text, ok){
    var el=document.getElementById('authMsg');
    if(!el) return;
    el.textContent=text||'';
    el.style.color=ok?'#16803c':'#c62828';
    el.style.display='block';
  }
  function client(){
    if(!window.supabase || typeof window.supabase.createClient!=='function') throw new Error('مكتبة تسجيل الدخول لم يتم تحميلها. حدّث الصفحة وحاول مرة أخرى.');
    if(!window.MADA_SUPABASE_URL || !window.MADA_SUPABASE_KEY) throw new Error('إعدادات قاعدة البيانات غير موجودة.');
    return window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
  }
  function install(){
    var login=document.getElementById('loginBtn');
    if(!login) return;
    login.type='button';
    login.onclick=async function(e){
      if(e) e.preventDefault();
      var email=(document.getElementById('emailInput')||{}).value?.trim()||'';
      var password=(document.getElementById('passwordInput')||{}).value||'';
      if(!email || !email.includes('@')) return show('اكتب بريدًا إلكترونيًا صحيحًا.');
      if(password.length<6) return show('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      login.disabled=true; login.textContent='جاري الدخول…'; show('');
      try{
        var result=await client().auth.signInWithPassword({email:email,password:password});
        if(result.error){
          var m=result.error.message||'';
          if(/confirm|verified|not confirmed/i.test(m)) show('البريد الإلكتروني غير مؤكد. افتح رسالة التأكيد ثم حاول مرة أخرى.');
          else if(/invalid login credentials/i.test(m)) show('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
          else show('تعذر تسجيل الدخول: '+m);
          return;
        }
        if(!result.data || !result.data.session){ show('تم الاتصال لكن لم يتم إنشاء جلسة. تأكد من إعدادات تأكيد البريد في Supabase.'); return; }
        show('تم تسجيل الدخول بنجاح ✓',true);
        try{
          if(typeof window.start==='function') await window.start();
          else location.href='./';
        }catch(navErr){ show('تم تسجيل الدخول، لكن تعذر فتح الصفحة: '+(navErr.message||navErr)); }
      }catch(err){ show('خطأ: '+(err && err.message ? err.message : String(err))); console.error('Mada login error',err); }
      finally{ login.disabled=false; login.textContent='دخول'; }
    };
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();
