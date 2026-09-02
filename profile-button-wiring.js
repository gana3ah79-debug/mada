(()=>{
 const $=id=>document.getElementById(id);
 let installed=false;
 function close(){ $('closeModal')?.click(); }
 function openProfile(id){ if(id && window.openProfile) window.openProfile(id); }
 function wire(page){
  if(!page||page.dataset.madaButtonsWired==='1')return;
  page.dataset.madaButtonsWired='1';
  // The three-dot header was only visual; hide it rather than leaving a dead button.
  const ph=page.querySelector('.fb-profile-header');
  const headerButtons=ph?.querySelectorAll('.fb-ph-btn');
  if(headerButtons?.length>1) headerButtons[1].remove();

  // Friends: every visible friend card opens that person's profile.
  page.querySelectorAll('[data-friend]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();openProfile(b.dataset.friend)}));
  const all=page.querySelector('.fb-friends-head button');
  all?.addEventListener('click',e=>{e.preventDefault();page.querySelector('#profileFriendsCount')?.click()});

  // "بم تفكر؟" opens the real composer on the home feed.
  page.querySelector('.fb-think')?.addEventListener('click',e=>{e.preventDefault();close();setTimeout(()=>{const el=$('postInput');el?.focus();el?.scrollIntoView({behavior:'smooth',block:'center'})},120)});

  // Media actions use the existing, real home composer controls.
  const mediaBtns=page.querySelectorAll('.fb-composer-actions button');
  mediaBtns[0]?.addEventListener('click',e=>{e.preventDefault();close();setTimeout(()=>$('photoBtn')?.click(),120)});
  mediaBtns[1]?.addEventListener('click',e=>{e.preventDefault();close();setTimeout(()=>$('videoBtn')?.click(),120)});
  mediaBtns[2]?.addEventListener('click',e=>{e.preventDefault();close();setTimeout(()=>window.MadaStoriesReels?.create?.('reel'),120)});

  // Profile tabs are real and should not be duplicated by enhancement scripts.
  page.querySelector('#tabPosts')?.addEventListener('click',()=>{page.querySelector('#tabPosts')?.classList.add('active');page.querySelector('#tabPhotos')?.classList.remove('active')});
  page.querySelector('#tabPhotos')?.addEventListener('click',()=>{page.querySelector('#tabPhotos')?.classList.add('active');page.querySelector('#tabPosts')?.classList.remove('active')});
 }
 function scan(){document.querySelectorAll('#modal .profile-page').forEach(wire)}
 function boot(){if(installed)return;installed=true;scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
 window.MadaProfileButtons={wire,scan};
})();
