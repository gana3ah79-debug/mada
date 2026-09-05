/* Mada phase 5 - direct handlers only; no global click interception or observers. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const safe=fn=>{try{fn()}catch(e){console.warn('Mada menu',e)}};
  function action(name){
    const map={profile:()=>window.ProfileUI?.open?.(window.user?.id),friends:()=>window.friendsView?.(),messages:()=>window.messagesView?.(),notifications:()=>window.notifications?.(),premium:()=>window.showModal?.('💎 Mada Premium','<div class="empty">سيتم فتح مزايا Premium هنا.</div>')};
    safe(()=>map[name]?.()); close();
  }
  function settings(){
    const d=$('madaDrawer'); if(!d)return;
    const body=d.querySelector('.mada-drawer-body');
    body.innerHTML='<div class="mada-menu-section"><div class="mada-menu-section-title">الإعدادات</div><div class="mada-settings"><div class="mada-setting-row"><div><b>الوضع الليلي</b><small>تغيير مظهر Mada</small></div><button id="madaThemeSwitch" class="mada-switch" type="button" aria-label="الوضع الليلي"></button></div><div class="mada-setting-row"><div><b>الإشعارات</b><small>إدارة تنبيهات التطبيق</small></div><button id="madaNotifyOpen" class="mada-menu-item" style="width:auto;padding:5px 8px" type="button">فتح</button></div></div></div>';
    const sw=$('madaThemeSwitch'); const sync=()=>sw?.classList.toggle('on',document.body.classList.contains('dark')); sync();
    sw?.addEventListener('click',()=>{const dark=!document.body.classList.contains('dark');document.body.classList.toggle('dark',dark);localStorage.setItem('mada-theme',dark?'dark':'light');const b=$('themeBtn');if(b)b.textContent=dark?'☀️':'🌙';sync()});
    $('madaNotifyOpen')?.addEventListener('click',()=>action('notifications'));
    const back=document.createElement('button');back.type='button';back.className='mada-menu-item';back.innerHTML='<span class="mada-menu-icon">‹</span><span class="mada-menu-copy"><b>العودة للقائمة</b></span>';back.addEventListener('click',render);body.appendChild(back);
  }
  function render(){
    const d=$('madaDrawer'); if(!d)return;
    d.querySelector('.mada-drawer-body').innerHTML='<div class="mada-menu-section"><div class="mada-menu-section-title">اختصارات</div><button class="mada-menu-item" data-mada-menu="profile" type="button"><span class="mada-menu-icon">👤</span><span class="mada-menu-copy"><b>الملف الشخصي</b><small>عرض حسابك ومنشوراتك</small></span><span class="mada-menu-chevron">‹</span></button><button class="mada-menu-item" data-mada-menu="friends" type="button"><span class="mada-menu-icon">👥</span><span class="mada-menu-copy"><b>الأصدقاء</b><small>إدارة الأصدقاء والطلبات</small></span><span class="mada-menu-chevron">‹</span></button><button class="mada-menu-item" data-mada-menu="messages" type="button"><span class="mada-menu-icon">💬</span><span class="mada-menu-copy"><b>الرسائل</b><small>محادثاتك الخاصة</small></span><span class="mada-menu-chevron">‹</span></button><button class="mada-menu-item" data-mada-menu="notifications" type="button"><span class="mada-menu-icon">🔔</span><span class="mada-menu-copy"><b>الإشعارات</b><small>آخر التنبيهات والتحديثات</small></span><span class="mada-menu-chevron">‹</span></button><button class="mada-menu-item" data-mada-menu="premium" type="button"><span class="mada-menu-icon">💎</span><span class="mada-menu-copy"><b>Mada Premium</b><small>مزايا إضافية وتجربة أفضل</small></span><span class="mada-menu-chevron">‹</span></button></div><div class="mada-menu-section"><div class="mada-menu-section-title">التطبيق</div><button class="mada-menu-item" id="madaSettingsBtn" type="button"><span class="mada-menu-icon">⚙️</span><span class="mada-menu-copy"><b>الإعدادات</b><small>المظهر والإشعارات</small></span><span class="mada-menu-chevron">‹</span></button></div>';
    d.querySelectorAll('[data-mada-menu]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.madaMenu)));
    $('madaSettingsBtn')?.addEventListener('click',settings);
  }
  function close(){const d=$('madaDrawer'),b=$('madaDrawerBackdrop');if(!d)return;d.classList.remove('open');b?.classList.remove('open');setTimeout(()=>{d.remove();b?.remove()},260)}
  function open(){
    if($('madaDrawer'))return;
    const b=document.createElement('div');b.id='madaDrawerBackdrop';b.className='mada-drawer-backdrop';
    const d=document.createElement('aside');d.id='madaDrawer';d.className='mada-drawer';d.setAttribute('aria-label','قائمة Mada');
    d.innerHTML='<div class="mada-drawer-head"><div class="mada-drawer-brand"><div class="mada-drawer-logo">M</div><div><b>MADA</b><small>كل ما تحتاجه في مكان واحد</small></div></div><button class="mada-drawer-close" type="button" aria-label="إغلاق">×</button></div><div class="mada-drawer-body"></div><div class="mada-drawer-footer">Mada • تواصل · شارك · اكتشف</div>';
    document.body.append(b,d); b.addEventListener('click',close); d.querySelector('.mada-drawer-close').addEventListener('click',close); render(); requestAnimationFrame(()=>{b.classList.add('open');d.classList.add('open')});
  }
  window.MadaMenuUI={open,close,settings};
})();