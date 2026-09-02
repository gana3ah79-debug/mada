(function(){
  function openProfileSafe(id){
    const target=id||window.madaUser?.()?.id;
    const profileOpen=window.ProfileUI?.open;
    if(!target||typeof profileOpen!=='function'){
      alert('واجهة الملف الشخصي لم تجهز بعد. حدّث الصفحة وحاول مرة أخرى.');
      return;
    }
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
  }
  const $=id=>document.getElementById(id);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
