(()=>{
 const modal=()=>document.getElementById('modal');
 function polish(){
  const m=modal(),page=m?.querySelector('.profile-page'); if(!m||!page)return;
  m.querySelector('.modal-card')?.classList.add('fb-profile-modal');
  const top=page.querySelector('.fb-profile-top'); if(top){top.querySelector('b')?.remove();top.style.justifyContent='flex-start';}
  const id=window.__MADA_PROFILE_ID, me=window.user?.id;
  if(id&&me&&id===me&&page.querySelector('#editProfile')&&!page.querySelector('#addStoryProfile')){
   const edit=page.querySelector('#editProfile');
   const story=document.createElement('button');story.id='addStoryProfile';story.type='button';story.className='profile-pill';story.textContent='➕ إضافة إلى القصة';
   edit.parentNode.insertBefore(story,edit);
   story.onclick=()=>{m.querySelector('#closeModal')?.click();setTimeout(()=>window.MadaStoriesReels?.create?.('story'),120)};
  }
 }
 const start=()=>{const m=modal();if(m)new MutationObserver(polish).observe(m,{childList:true,subtree:true});polish()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
