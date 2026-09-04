/* Mada private-group UI guard. DB RLS remains the source of truth. */
(function(){
  const toast=m=>window.madaToast?window.madaToast(m):console.log(m);
  const sendRequest=async(id)=>{if(!window.sb||!window.user)return false;const r=await window.sb.from('group_join_requests').upsert({group_id:id,user_id:window.user.id},{onConflict:'group_id,user_id'});if(r.error){toast('تعذر إرسال طلب الانضمام');return true}toast('تم إرسال طلب الانضمام 🔒');return true};
  function guard(){
    document.addEventListener('click',async e=>{
      const listBtn=e.target.closest('.group-action');
      if(listBtn?.dataset.action==='join'){
        const card=listBtn.closest('.group-card');const id=card?.dataset.id;if(!id||!window.sb||!window.user)return;
        const {data:g}=await window.sb.from('groups').select('id,privacy').eq('id',id).maybeSingle();
        if(g?.privacy==='private'){e.preventDefault();e.stopImmediatePropagation();await sendRequest(id);return}
      }
      const b=e.target.closest('#groupJoin');
      if(!b||!window.sb||!window.user)return;
      const shell=b.closest('.groups-shell');
      const title=shell?.querySelector('.group-detail-head h2')?.textContent?.trim();
      if(!title)return;
      const {data:g}=await window.sb.from('groups').select('id,privacy').eq('name',title).maybeSingle();
      if(g?.privacy==='private'){e.preventDefault();e.stopImmediatePropagation();await sendRequest(g.id)}
    },true);
  }
  function forceLatestGroups(){
    const s=document.createElement('script');s.src='groups.js?v=20260904-03';s.async=false;s.dataset.madaGroupsLatestForce='1';document.head.appendChild(s);
    setTimeout(()=>{const b=document.getElementById('groupsBtn');if(b&&typeof window.openGroups==='function')b.onclick=window.openGroups},1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{guard();forceLatestGroups()});else{guard();forceLatestGroups()}
})();