/* Mada Optimistic UI v1 - instant comment/share feedback without feed reloads. */
(function(){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const original=window.addComment;
  if(typeof original==='function' && window.sb){
    window.addComment=async function(id){
      if(!window.user)return;
      const box=document.querySelector(`[data-comment="${id}"]`),body=box?.value.trim();if(!body)return;
      const comments=articleComments(id); const row=document.createElement('div');row.className='comment mada-comment-pending';
      row.innerHTML=`<b>${esc(window.profile?.display_name||'أنت')}</b> ${esc(body)} <small>جارٍ النشر…</small>`;
      comments.appendChild(row); if(box)box.value='';
      try{
        const r=await window.sb.from('comments').insert({post_id:id,author_id:window.user.id,body}).select('id,created_at').single();
        if(r.error)throw r.error;
        row.classList.remove('mada-comment-pending');row.classList.add('mada-comment-sent');row.querySelector('small').textContent='الآن';
        const input=comments.querySelector('[data-comment]'); if(input)input.placeholder='اكتب تعليقًا…';
      }catch(e){row.remove();if(box)box.value=body;alert('تعذر إضافة التعليق: '+e.message)}
    };
  }
  function articleComments(id){
    const a=document.getElementById('post-'+id);return a?.querySelector('.comments')||document.createElement('div');
  }
  window.MadaOptimisticUI={version:'1.0'};
})();
