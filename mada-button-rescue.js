/* Mada button rescue: explicit element handlers only. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const safe=(fn)=>{try{const r=fn();if(r&&typeof r.catch==='function')r.catch(e=>console.warn('Mada button',e))}catch(e){console.warn('Mada button',e)}};
  function bind(){
    const actions={
      searchBtn:()=>window.MadaCoreControls?.search?.(),
      msgBtn:()=>typeof window.messagesView==='function'&&window.messagesView(),
      msgBtn2:()=>typeof window.messagesView==='function'&&window.messagesView(),
      friendsNav:()=>typeof window.friendsView==='function'&&window.friendsView(),
      friendsBottom:()=>typeof window.friendsView==='function'&&window.friendsView(),
      notifyBtn:()=>typeof window.notifications==='function'&&window.notifications(),
      notifyNav:()=>typeof window.notifications==='function'&&window.notifications(),
      notifyBottom:()=>typeof window.notifications==='function'&&window.notifications(),
      profileNav:()=>window.ProfileUI?.open?.(window.user?.id),
      createNav:()=>{const x=$('postInput');x?.focus();x?.scrollIntoView({behavior:'smooth',block:'center'})},
      createBottom:()=>{const x=$('postInput');x?.focus();x?.scrollIntoView({behavior:'smooth',block:'center'})},
      photoBtn:()=>{$('imageInput')?.click()},
      videoBtn:()=>{$('imageInput')?.click()},
      allStoriesBtn:()=>window.MadaSocialUpgrades?.loadPublicStories?.(),
      reelsBtn:()=>window.MadaSocialUpgrades?.loadReels?.(),
      addStoryBtn:()=>window.MadaStoriesReels?.create?.('story'),
      premiumBtn:()=>window.showModal?.('💎 Mada Premium','<div class="empty">سيتم فتح مزايا Premium هنا.</div>'),
      premiumBannerBtn:()=>$( 'premiumBtn')?.click(),
      premiumBannerAction:()=>$( 'premiumBtn')?.click(),
      themeBtn:()=>{const dark=!document.body.classList.contains('dark');document.body.classList.toggle('dark',dark);localStorage.setItem('mada-theme',dark?'dark':'light');const b=$('themeBtn');if(b)b.textContent=dark?'☀️':'🌙'},
      menuBtn:()=>window.showModal?.('☰ القائمة','<div class="quick-grid"><button type="button" id="rescueFriends">👥 الأصدقاء</button><button type="button" id="rescueMessages">💬 الرسائل</button><button type="button" id="rescueNotifications">🔔 الإشعارات</button></div>'),
      menuBottom:()=>$('menuBtn')?.click()
    };
    Object.entries(actions).forEach(([id,fn])=>{const el=$(id);if(!el||el.dataset.rescueBound)return;el.dataset.rescueBound='1';el.onclick=e=>{e.preventDefault();safe(fn)}});
    const close=$('closeModal');if(close&&!close.dataset.rescueBound){close.dataset.rescueBound='1';close.onclick=()=>safe(()=>window.closeModal?.())}
    const post=$('postBtn');if(post&&!post.dataset.rescueBound){post.dataset.rescueBound='1';post.onclick=()=>safe(()=>window.addPost?.())}
    const authClose=document.querySelector('.auth-sheet-close');if(authClose&&!authClose.dataset.rescueBound){authClose.dataset.rescueBound='1';authClose.onclick=()=>safe(()=>window.MadaAuth?.close?.())}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
  window.MadaButtonRescue={bind};
})();
