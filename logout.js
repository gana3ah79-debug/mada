(() => {
  const $ = id => document.getElementById(id);

  async function madaLogout() {
    const supabaseClient = window.sb || window.supabaseClient;
    if (!supabaseClient?.auth) return;
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      console.error('Mada logout error:', error);
      if (typeof window.showModal === 'function') {
        window.showModal('تسجيل الخروج', '<p>تعذر تسجيل الخروج. حاول مرة أخرى.</p>');
      } else {
        alert('تعذر تسجيل الخروج. حاول مرة أخرى.');
      }
      return;
    }
    document.getElementById('modal')?.setAttribute('hidden', '');
    const auth = $('auth');
    const app = $('app');
    if (auth) auth.hidden = false;
    if (app) app.hidden = true;
    window.location.reload();
  }

  function addLogoutButton() {
    const profileNav = $('profileNav');
    if (!profileNav || profileNav.dataset.logoutReady) return;
    profileNav.dataset.logoutReady = '1';
    profileNav.addEventListener('click', () => {
      setTimeout(() => {
        const body = $('modalBody');
        if (!body || $('logoutBtn')) return;
        const button = document.createElement('button');
        button.id = 'logoutBtn';
        button.className = 'primary wide';
        button.type = 'button';
        button.textContent = '🚪 تسجيل الخروج';
        button.style.marginTop = '16px';
        button.onclick = madaLogout;
        body.appendChild(button);
      }, 50);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addLogoutButton);
  else addLogoutButton();
  window.madaLogout = madaLogout;
})();
