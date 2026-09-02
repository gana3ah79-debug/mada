(function(){
  let profileHistory=false;

  function enterProfileHistory(id){
    if(profileHistory)return;
    profileHistory=true;
    try{history.pushState({madaProfile:true,profileId:id||null},'',location.href)}catch(e){console.warn('profile history',e)}
  }

  function leaveProfileHistory(){
    if(!profileHistory)return false;
    profileHistory=false;
    try{history.back();return true}catch(e){return false}
  }

  function openProfileSafe(id){
    const target=id||window.madaUser?.()?.id;
    const profileOpen=window.ProfileUI?.open;
    if(!target||typeof profileOpen!=='function'){
      alert('واجهة الملف الشخصي لم تجهز بعد. حدّث الصفحة وحاول مرة أخرى.');
      return;
    }
    enterProfileHistory(target);
    return Promise.resolve(profileOpen(target)).then(()=>{
      if(window.MadaFeatureControls?.enhanceProfile){
        setTimeout(()=>window.MadaFeatureControls.enhanceProfile(target),120);
      }
    }).catch(err=>{
      console.error('Mada profile open error',err);
      const msg=err?.message||'حدث خطأ أثناء فتح الملف الشخصي.';
      if(window.showModal)window.showModal('👤 الملف الشخصي',`<div class="empty">تعذر فتح الملف الشخصي.<br><small>${String(msg).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]))}</small></div>`);
      else alert('تعذر فتح الملف الشخصي: '+msg);
    });
  }

  window.openProfile=openProfileSafe;

  window.addEventListener('popstate',function(e){
    if(!profileHistory)return;
    profileHistory=false;
    if(window.closeModal)window.closeModal();
  });

  function bind(){
    const menu=$('menuBtn');
    if(!menu||menu.dataset.profileEntryFix)return;
    menu.dataset.profileEntryFix='1';
    menu.addEventListener('click',function(){
      setTimeout(()=>{
        const body=document.getElementById('modalBody');
        const btn=body?.querySelector('.menu-list button');
        if(btn&&!btn.dataset.profileEntryBound){
          btn.dataset.profileEntryBound='1';
          btn.onclick=e=>{e.preventDefault();e.stopPropagation();openProfileSafe();};
        }
      },0);
    });

    const close=document.getElementById('closeModal');
    if(close&&!close.dataset.profileHistoryBound){
      close.dataset.profileHistoryBound='1';
      close.addEventListener('click',function(){
        if(profileHistory)leaveProfileHistory();
      },true);
    }
  }

  const $=id=>document.getElementById(id);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
