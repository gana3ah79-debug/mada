(()=>{
 const $=id=>document.getElementById(id);
 let installed=false;
 function close(){ $('closeModal')?.click(); }
 function openProfile(id){ if(id && window.ProfileUI?.open) window.ProfileUI.open(id); else if(id && window.openProfile) window.openProfile(id); }
 function stop(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}
 function loadActionsFix(){if(window.MadaProfileActionsFix)return;const s=document.createElement('script');s.src='profile-actions-fix.js?v=20260902-4';s.onload=()=>window.MadaProfileActionsFix?.wire?.();document.body.appendChild(s)}
 function wire(page){
  if(!page)return; loadActionsFix();
  if(page.dataset.madaButtonsWired==='1')return;
  page.dataset.madaButtonsWired='1';
  const ph=page.querySelector('.fb-profile-header'); const headerButtons=ph?.querySelectorAll('.fb-ph-btn'); if(headerButtons?.length>1) headerButtons[1].remove();
  page.querySelectorAll('[data-friend]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();openProfile(b.dataset.friend)}));
  const all=page.querySelector('.fb-friends-head button'); all?.addEventListener('click',e=>{e.preventDefault();page.querySelector('#profileFriendsCount')?.click()});
  page.querySelector('.fb-think')?.addEventListener('click',e=>{e.preventDefault();close();setTimeout(()=>{$('postInput')?.focus();$('postInput')?.scrollIntoView({behavior:'smooth',block:'center'})},120)});
  const mediaBtns=page.querySelectorAll('.fb-composer-actions button');
  mediaBtns[0]?.addEventListener('click',e=>{e.preventDefault();close();setTimeout(()=>$('photoBtn')?.click(),120)});
  mediaBtns[1]?.addEventListener('click',e=>{e.preventDefault();close();setTimeout(()=>$('videoBtn')?.click(),120)});
  mediaBtns[2]?.addEventListener('click',e=>{e.preventDefault();close();setTimeout(()=>window.MadaStoriesReels?.create?.('reel'),120)});
 }
 function scan(){document.querySelectorAll('#modal .profile-page').forEach(wire);window.MadaProfileActionsFix?.wire?.()}
 function boot(){if(installed)return;installed=true;scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
 window.MadaProfileButtons={wire,scan};
})();
