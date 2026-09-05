/* Mada post details v2 - safe progressive enhancement. */
(function(){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  function open(id){
    const article=document.getElementById('post-'+id); if(!article)return;
    const clone=article.cloneNode(true);
    clone.classList.add('mada-post-detail');
    clone.querySelectorAll('[data-comment-toggle],[data-comments-open]').forEach(x=>x.removeAttribute('data-comment-toggle'));
    const modal=document.getElementById('modal'); if(!modal)return;
    document.getElementById('modalTitle').textContent='منشور';
    document.getElementById('modalBody').innerHTML='';
    document.getElementById('modalBody').appendChild(clone);
    modal.hidden=false; modal.style.display='grid'; document.body.classList.add('modal-open');
  }
  function scan(){
    document.querySelectorAll('#feed article.post').forEach(article=>{
      if(article.dataset.detailReady)return;
      article.dataset.detailReady='1';
      const meta=article.querySelector('.post-meta');
      if(!meta)return;
      const link=document.createElement('button');
      link.type='button'; link.className='mada-post-details-link'; link.textContent='عرض تفاصيل المنشور';
      link.addEventListener('click',()=>open(article.id.replace('post-','')));
      meta.appendChild(link);
    });
  }
  function boot(){const feed=document.getElementById('feed');if(!feed)return;scan();let timer=0;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(scan,150)}).observe(feed,{childList:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.MadaPostDetails={open};
})();
