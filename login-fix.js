// Mada login fix: loaded after app.js so it replaces the old login handler.
(function () {
  const $ = (id) => document.getElementById(id);
  const button = $('loginBtn');
  if (!button) return;

  function getClient() {
    if (!window.supabase || !window.MADA_SUPABASE_URL || !window.MADA_SUPABASE_KEY) {
      throw new Error('تعذر تشغيل الاتصال بقاعدة البيانات.');
    }
    return window.supabase.createClient(window.MADA_SUPABASE_URL, window.MADA_SUPABASE_KEY);
  }

  async function signIn() {
    const email = $('emailInput')?.value.trim();
    const password = $('passwordInput')?.value || '';
    const msg = $('authMsg');
    if (!email) return (msg.textContent = 'اكتب البريد الإلكتروني.');
    if (password.length < 6) return (msg.textContent = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.');

    button.disabled = true;
    button.textContent = 'جاري الدخول…';
    try {
      const sb = getClient();
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        msg.textContent = error.message === 'Invalid login credentials'
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
          : 'تعذر تسجيل الدخول: ' + error.message;
        return;
      }
      if (!data?.session) {
        msg.textContent = 'تم تسجيل الدخول لكن لم يتم إنشاء جلسة. حاول مرة أخرى.';
        return;
      }
      location.reload();
    } catch (e) {
      msg.textContent = e?.message || 'حدث خطأ غير متوقع.';
    } finally {
      button.disabled = false;
      button.textContent = 'دخول';
    }
  }

  async function signUp() {
    const name = $('nameInput')?.value.trim();
    const email = $('emailInput')?.value.trim();
    const password = $('passwordInput')?.value || '';
    const msg = $('authMsg');
    if (!email) return (msg.textContent = 'اكتب البريد الإلكتروني.');
    if (password.length < 6) return (msg.textContent = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.');

    const sb = getClient();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { display_name: name || email.split('@')[0] } }
    });
    if (error) return (msg.textContent = 'تعذر إنشاء الحساب: ' + error.message);
    msg.textContent = data?.session
      ? 'تم إنشاء الحساب وتسجيل الدخول.'
      : 'تم إنشاء الحساب. افتح بريدك وأكد البريد ثم اضغط دخول.';
  }

  // Replace the old handler from app.js.
  button.onclick = signIn;
  button.textContent = 'دخول';

  if (!$('registerBtn')) {
    const register = document.createElement('button');
    register.id = 'registerBtn';
    register.type = 'button';
    register.textContent = 'إنشاء حساب جديد';
    register.style.cssText = 'display:block;width:100%;margin:8px 0;padding:13px;border:0;border-radius:13px;font-size:16px;font-weight:700;';
    button.parentNode.insertBefore(register, button.nextSibling);
    register.onclick = async () => {
      register.disabled = true;
      try { await signUp(); } catch (e) { $('authMsg').textContent = e?.message || 'حدث خطأ أثناء إنشاء الحساب.'; }
      finally { register.disabled = false; }
    };
  }
})();
