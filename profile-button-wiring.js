(()=>{
 const $=id=>document.getElementById(id);
 let installed=false;
 function close(){ $('closeModal')?.click(); }
 function openProfile(id){ if(id && window.ProfileUI?.open) window.ProfileUI.open(id); else if(id && window.openProfile) window.openProfile(id); }
 function stop(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}
 function sb(){return window.MADA_SUPABASE_CLIENT||window.sb}
 function installLikeGuard(){
  if(document.documentElement.dataset.madaLikeGuard==='1')return;
  document.documentElement.dataset.madaLikeGuard='1';
  document.addEventListener('click',async e=>{
   const button=e.target.closest?.('.profile-like');
   if(!button)return;
   stop(e);
   if(button.dataset.busy==='1')return;
   const client=sb(); if(!client)return;
   const postId=button.dataset.id,wasLiked=button.dataset.liked==='true';
   const oldText=button.textContent,match=oldText.match(/(\d+)\s*$/),oldCount=match?Number(match[1]):0;
   const nextLiked=!wasLiked,nextCount=Math.max(0,oldCount+(nextLiked?1:-1));
   button.dataset.busy='1';
   button.dataset.liked=String(nextLiked);
   button.classList.toggle('liked',nextLiked);
   button.textContent=`${nextLiked?'💙':'👍'} إعجاب ${nextCount}`;
   try{
    const auth=await client.auth.getUser(),me=auth.data?.user;
    if(!me)throw new Error('يجب تسجيل الدخول أولًا');
    const q=nextLiked?await client.from('post_likes').insert({post_id:postId,user_id:me.id}):await client.from('post_likes').delete().eq('post_id',postId).eq('user_id',me.id);
    if(q.error)throw q.error;
   }catch(err){
    button.dataset.liked=String(wasLiked);
    button.classList.toggle('liked',wasLiked);
    button.textContent=oldText;
    if(window.showModal)window.showModal('Mada',`<div class="empty">تعذر حفظ الإعجاب: ${err?.message||err}</div>`);else alert('تعذر حفظ الإعجاب: '+(err?.message||err));
   }finally{button.dataset.busy='0'}
  },true);
 }
 function loadActionsFix(){if(window.MadaProfileActionsFix)return;const s=document.createElement('script');s.src='profile-actions-fix.js?v=20260902-3';s.onload=()=>window.MadaProfileActionsFix?.wire?.();document.body.appendChild(s)}
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
 function boot(){if(installed)return;installed=true;installLikeGuard();scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
 window.MadaProfileButtons={wire,scan};
})();
