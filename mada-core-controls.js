/* Mada safe homepage controls: direct handlers only, no global click interception or observers. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const call=(name,...args)=>{try{const fn=window[name];return typeof fn==='function'?fn(...args):null}catch(e){console.warn('Mada control',name,e);return null}};
  function search(){
    if(typeof window.MadaFeatureControls?.searchPanel==='function')return window.MadaFeatureControls.searchPanel();
    if(typeof window.showModal!=='function')return;
    showModal('⌕ بحث في Mada','<div class="mada-search"><input id="madaCoreSearch" placeholder="ابحث عن شخص…" autocomplete="off"><button id="madaCoreSearchBtn" class="primary wide">بحث</button><div id="madaCoreSearchResults" class="results"></div></div>');
    const run=async()=>{const q=$('madaCoreSearch')?.value.trim(),box=$('madaCoreSearchResults');if(!box)return;if(q.length<2){box.innerHTML='<div class="empty">اكتب حرفين على الأقل للبحث.</div>';return}box.innerHTML='<div class="empty">جاري البحث…</div>';const rows=await call('searchUsers',q)||[];box.innerHTML=rows.length?rows.map(x=>`<button type="button" class="user-row" data-core-profile="${x.id}"><span class="avatar">${String(x.display_name||'م').trim().charAt(0)}</span><span class="user-info"><b>${String(x.display_name||'مستخدم')}</b></span></button>`).join(''):'<div class="empty">لا توجد نتائج مطابقة.</div>';};
    $('madaCoreSearchBtn').onclick=run;$('madaCoreSearch').onkeydown=e=>{if(e.key==='Enter')run()};$('madaCoreSearchResults').onclick=e=>{const b=e.target.closest('[data-core-profile]');if(b)window.ProfileUI?.open?.(b.dataset.coreProfile)};$('madaCoreSearch').focus();
  }
  function bind(){
    const pairs={searchBtn:search,searchNav:search,videoBtn:()=>$('imageInput')?.click(),photoBtn:()=>$('imageInput')?.click(),createNav:()=>$('postInput')?.focus(),createBottom:()=>$('postInput')?.focus(),friendsNav:()=>call('friendsView'),friendsBottom:()=>call('friendsView'),msgBtn:()=>call('messagesView'),msgBtn2:()=>call('messagesView'),notifyBtn:()=>call('notifications'),notifyNav:()=>call('notifications'),notifyBottom:()=>call('notifications'),profileNav:()=>window.ProfileUI?.open?.(window.user?.id),premiumBannerAction:()=>$('premiumBtn')?.click(),premiumBannerBtn:()=>$('premiumBtn')?.click(),themeBtn:()=>{if(typeof window.applyTheme==='function')window.applyTheme(!document.body.classList.contains('dark'))},menuBtn:()=>call('showModal','☰ القائمة','<div class="empty">استخدم الأصدقاء والرسائل والإشعارات من الأزرار الرئيسية.</div>'),menuBottom:()=>$('menuBtn')?.click(),allStoriesBtn:()=>window.MadaSocialUpgrades?.loadPublicStories?.(),reelsBtn:()=>window.MadaSocialUpgrades?.loadReels?.(),addStoryBtn:()=>window.MadaStoriesReels?.create?.('story')};
    Object.entries(pairs).forEach(([id,fn])=>{const el=$(id);if(!el||el.dataset.coreBound)return;el.dataset.coreBound='1';el.addEventListener('click',e=>{try{fn(e)}catch(err){console.warn('Mada button',id,err)}},false)});
    const modal=$('modal');if(modal&&!modal.dataset.coreBound){modal.dataset.coreBound='1';modal.addEventListener('click',e=>{const b=e.target.closest('[data-core-profile]');if(b)window.ProfileUI?.open?.(b.dataset.coreProfile)})}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
  window.MadaCoreControls={bind,search};
})();