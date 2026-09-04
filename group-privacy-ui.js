/* Mada private-group UI guard. DB RLS remains the source of truth. */
(function(){
  const toast=m=>window.madaToast?window.madaToast(m):console.log(m);
  function guard(){
    document.addEventListener('click',async e=>{
      const b=e.target.closest('#groupJoin');
      if(!b)return;
      const shell=b.closest('.groups-shell');
      const title=shell?.querySelector('.group-detail-head h2')?.textContent?.trim();
      if(!title||!window.sb||!window.user)return;
      const {data:g}=await window.sb.from('groups').select('id,privacy').eq('name',title).maybeSingle();
      if(g?.privacy==='private'){
        e.preventDefault();e.stopImmediatePropagation();
        toast('🔒 هذه مجموعة خاصة. الانضمام المباشر غير متاح حالياً.');
      }
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',guard);else guard();
})();