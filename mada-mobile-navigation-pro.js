(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const go=(id,fn)=>{const el=$(id);if(el){el.addEventListener('click',e=>{e.preventDefault();fn?.();});return true}return false};
  function modalFallback(title,body){if(window.showModal)return window.showModal(title,body);const m=$('modal');if(!m)return; m.hidden=false; $('modalTitle').textContent=title; $('modalBody').innerHTML=body;}
  function nav(action){
    if(action==='home'){window.scrollTo({top:0,behavior:'smooth'});return}
    if(action==='profile'){if(window.ProfileUI?.open){window.ProfileUI.open(window.user?.id);return} if(window.openProfile&&window.user?.id)window.openProfile(window.user.id);return}
    if(action==='friends'){if(window.openFriends){window.openFriends();return} if($('friendsNav'))$('friendsNav').click();return}
    if(action==='messages'){if(window.MessengerPro?.open){window.MessengerPro.open();return} if(window.openChat)window.openChat(); else $('msgBtn')?.click();return}
    if(action==='notifications'){if(window.notifications){window.notifications();return} $('notifyBtn')?.click();return}
    if(action==='search'){if(window.MadaUnifiedSearch?.open){window.MadaUnifiedSearch.open();return} $('searchBtn')?.click();return}
    if(action==='create'){$('createNav')?.click();return}
    if(action==='menu'){$('menuBtn')?.click();return}
  }
  function enhance(){
    const top=document.querySelector('.topbar');
    if(top&&!top.querySelector('.mada-mobile-title')){
      const title=document.createElement('div');title.className='mada-mobile-title';title.innerHTML='<strong>MADA</strong><span>مدى</span>';title.setAttribute('aria-label','Mada');
      const brand=top.querySelector('.mada-wordmark'); if(brand){brand.replaceWith(title)} else top.insertBefore(title,top.firstChild);
    }
    const old=document.querySelector('.mada-mobile-tools'); if(old)old.remove();
    const tools=document.createElement('div');tools.className='mada-mobile-tools';
    tools.innerHTML='<button data-mnav="search" aria-label="بحث"><span>⌕</span></button><button data-mnav="messages" aria-label="الرسائل"><span>💬</span><i id="mnavMsgBadge" hidden></i></button><button data-mnav="notifications" aria-label="الإشعارات"><span>🔔</span><i id="mnavNotifyBadge" hidden></i></button>';
    top.appendChild(tools);
    const bottom=document.querySelector('.bottom-nav');
    if(bottom){bottom.innerHTML='<button data-mnav="home" class="active"><span>⌂</span><small>الرئيسية</small></button><button data-mnav="search"><span>⌕</span><small>بحث</small></button><button data-mnav="create" class="bottom-plus" aria-label="إنشاء"><span>＋</span></button><button data-mnav="notifications"><span>♡</span><small>التنبيهات</small><i id="mnavBottomBadge" hidden></i></button><button data-mnav="profile"><span>◉</span><small>حسابي</small></button>}
    document.querySelectorAll('[data-mnav]').forEach(b=>b.onclick=()=>nav(b.dataset.mnav));
    syncBadges();
  }
  function setBadge(id,n){const el=$(id);if(!el)return;const v=Math.max(0,Number(n)||0);el.textContent=v>99?'99+':String(v);el.hidden=!v}
  function syncBadges(){
    setTimeout(()=>{const n=Number(document.querySelector('#notifyBtn .badge,.notify-badge,#notifyNav .badge')?.textContent||0);setBadge('mnavNotifyBadge',n);setBadge('mnavBottomBadge',n)},700);
    const obs=new MutationObserver(()=>{const n=Number(document.querySelector('#notifyBtn .badge,.notify-badge,#notifyNav .badge')?.textContent||0);setBadge('mnavNotifyBadge',n);setBadge('mnavBottomBadge',n)});obs.observe(document.body,{childList:true,subtree:true,characterData:true});
  }
  function style(){if($('mada-mobile-navigation-style'))return;const s=document.createElement('style');s.id='mada-mobile-navigation-style';s.textContent=`
.mada-mobile-title{display:flex;align-items:center;justify-content:center;gap:6px;line-height:1;min-width:120px}.mada-mobile-title strong{font-size:25px;font-weight:1000;letter-spacing:1.5px;background:linear-gradient(135deg,#2563eb,#06b6d4,#7c3aed);-webkit-background-clip:text;background-clip:text;color:transparent}.mada-mobile-title span{font-size:11px;color:#64748b;font-weight:900;margin-top:14px}.mada-mobile-tools{display:none;margin-inline-start:auto;gap:6px}.mada-mobile-tools button{position:relative;width:40px;height:40px;border:1px solid rgba(255,255,255,.8);border-radius:13px;background:rgba(255,255,255,.82);box-shadow:0 6px 14px rgba(15,23,42,.10);font-size:19px}.mada-mobile-tools i,.bottom-nav [id^="mnav"]{position:absolute;min-width:16px;height:16px;padding:0 4px;border-radius:99px;background:#ef4444;color:#fff;font:700 9px/16px Arial;right:1px;top:1px;font-style:normal}.bottom-nav [data-mnav]{position:relative}.bottom-nav small{display:block;font-size:10px;margin-top:3px}.bottom-nav [data-mnav] span{font-size:21px}.bottom-nav .bottom-plus span{font-size:30px}.bottom-nav [data-mnav="home"]{color:#2563eb;background:rgba(239,246,255,.9)}
@media(max-width:600px){.topbar{padding:0 9px!important;justify-content:center!important}.topbar>.icon-btn:first-child{position:absolute;right:8px}.top-actions{display:none!important}.mada-mobile-title{margin:auto}.mada-mobile-tools{display:flex;position:absolute;left:7px}.bottom-nav{z-index:500!important}.bottom-nav button{margin:4px 2px!important}.page-wrap{padding-bottom:6px}.quick-grid{margin-top:4px}.stories{border-radius:18px}.composer{border-radius:18px}.feed{padding-bottom:8px}}
@media(min-width:601px){.mada-mobile-title{display:none}}
body.dark .mada-mobile-tools button{background:rgba(24,39,62,.9);color:#eef6ff;border-color:#33445f}
`;document.head.appendChild(s)}
  function boot(){style();enhance();window.MadaMobileNavigation={enhance,nav,syncBadges}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,700));else setTimeout(boot,700);
})();
