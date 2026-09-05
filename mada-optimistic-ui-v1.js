/* Mada Optimistic UI v2 - instant, reliable comments with count updates. */
(function(){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const original=window.addComment;
  if(typeof original==='function' && window.sb){
    window.addComment=async function(id){
      if(!window.user)return;
      const box=document.querySelector(`[data-comment="${id}"]`),body=box?.value.trim();if(!body)return;
      const comments=articleComments(id),before=countComments(comments);const row=document.createElement('div');row.className='comment mada-comment-pending mada-comment-v2';
      row.innerHTML=`<b><span class="mada-comment-avatar">${esc((window.profile?.display_name||'أنت').trim().charAt(0)||'أ')}</span>${esc(window.profile?.display_name||'أنت')}</b> ${esc(body)} <small>جارٍ النشر…</small>`;
      const form=comments.querySelector('.comment-box');form?comments.insertBefore(row,form):comments.appendChild(row);if(box)box.value='';
      try{
        const r=await window.sb.from('comments').insert({post_id:id,author_id:window.user.id,body}).select('id,created_at').single();
        if(r.error)throw r.error;
        row.dataset.commentId=r.data?.id||'';row.classList.remove('mada-comment-pending');row.classList.add('mada-comment-sent');row.querySelector('small').textContent='الآن';
        updateCommentCount(id,before+1);
      }catch(e){row.remove();if(box)box.value=body;alert('تعذر إضافة التعليق: '+(e.message||'حدث خطأ'))}
    };
  }
  function articleComments(id){const a=document.getElementById('post-'+id);return a?.querySelector('.comments')||document.createElement('div')}
  function countComments(box){return box.querySelectorAll(':scope > .comment').length}
  function updateCommentCount(id,n){const a=document.getElementById('post-'+id);if(!a)return;const nodes=a.querySelectorAll('[data-comments-open],.meta-link');nodes.forEach(el=>{if(el.dataset.commentsOpen!==undefined||/تعليق/.test(el.textContent||''))el.textContent=`💬 ${n} تعليق`})}
  window.MadaOptimisticUI={version:'2.0'};
})();
