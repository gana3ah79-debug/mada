/* Mada comments v2 - polished comments UI, progressive enhancement only. */
(function(){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  function enhance(article){
    const box=article.querySelector('.comments'); if(!box||box.dataset.madaCommentsV2)return;
    box.dataset.madaCommentsV2='1';
    const rows=[...box.querySelectorAll(':scope > .comment')];
    rows.forEach((row,i)=>{
      row.dataset.commentIndex=String(i);
      row.classList.add('mada-comment-v2');
      const b=row.querySelector('b');
      if(b){const name=b.textContent||'مستخدم';b.textContent='';b.insertAdjacentHTML('afterbegin',`<span class="mada-comment-avatar">${esc(name.trim().charAt(0)||'م')}</span>`);row.insertAdjacentHTML('beforeend',`<div class="mada-comment-tools"><button type="button" data-comment-reply>رد</button><button type="button" data-comment-like>♡</button></div>`)}
    });
    if(rows.length>3){
      rows.slice(0,-3).forEach(r=>r.hidden=true);
      const more=document.createElement('button');more.type='button';more.className='mada-comments-more';more.textContent=`عرض ${rows.length-3} تعليق إضافي`;
      more.addEventListener('click',()=>{rows.forEach(r=>r.hidden=false);more.remove()});
      box.insertBefore(more,box.querySelector('.comment-box'));
    }
    const input=box.querySelector('[data-comment]');
    if(input){input.classList.add('mada-comment-input');input.setAttribute('aria-label','اكتب تعليقًا');}
    const send=box.querySelector('[data-send]');
    if(send){send.classList.add('mada-comment-send');send.addEventListener('click',()=>setTimeout(()=>{box.dataset.madaCommentsV2='';enhance(article)},350),true)}
    box.addEventListener('click',e=>{
      const reply=e.target.closest('[data-comment-reply]');
      if(reply){e.preventDefault();if(input){input.focus();input.placeholder='اكتب ردك…';}}
      const like=e.target.closest('[data-comment-like]');
      if(like){like.classList.toggle('active');like.textContent=like.classList.contains('active')?'♥':'♡';}
    });
  }
  function scan(){document.querySelectorAll('#feed article.post').forEach(enhance)}
  function boot(){const feed=document.getElementById('feed');if(!feed)return;scan();let timer=0;const obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(scan,120)});obs.observe(feed,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
