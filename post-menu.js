/* Mada post menu: three-dot actions on the left side of every post. */
(function(){
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const getUser=()=>window.user||(typeof user!=='undefined'?user:null);
  const getSb=()=>window.sb||(typeof sb!=='undefined'?sb:null);
  function closeMenus(){document.querySelectorAll('.mada-post-menu').forEach(x=>x.remove())}
  function menu(id){return `<div class="mada-post-menu" data-post-menu="${esc(id)}" role="menu"><button type="button" data-post-action="copy">🔗 نسخ رابط المنشور</button><button type="button" class="danger" data-post-action="delete">🗑️ حذف المنشور</button></div>`}
  function addMenus(){
    document.querySelectorAll('#feed article.post[id^="post-"]').forEach(article=>{
      if(article.querySelector('.post-more'))return;
      const id=article.id.slice(5),head=article.querySelector('.post-head');
      if(!head)return;
      const current=getUser(),authorId=article.querySelector('[data-profile]')?.dataset.profile,mine=!!current&&!!authorId&&authorId===current.id;
      const wrap=document.createElement('div');
      wrap.className='post-more-wrap';
      wrap.innerHTML=`<button class="post-more" type="button" aria-label="المزيد" aria-expanded="false">⋯</button>${mine?menu(id):''}`;
      head.appendChild(wrap);
      const btn=wrap.querySelector('.post-more');
      btn.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();
        const existing=wrap.querySelector('.mada-post-menu');
        if(existing){closeMenus();btn.setAttribute('aria-expanded','false');return}
        closeMenus();
        const fresh=getUser(),isMine=!!fresh&&authorId===fresh.id;
        if(isMine){btn.insertAdjacentHTML('afterend',menu(id));btn.setAttribute('aria-expanded','true')}
        else wrap.insertAdjacentHTML('beforeend','<div class="mada-post-menu" data-post-menu="info"><div class="menu-info">خيارات المنشور متاحة لصاحب المنشور فقط.</div></div>');
      });
    });
  }
  async function deletePost(id){
    const current=getUser(),client=getSb();
    if(!current||!client)return;
    if(!confirm('هل أنت متأكد من حذف هذا المنشور؟\nسيتم حذفه نهائيًا.'))return;
    const r=await client.from('posts').delete().eq('id',id).eq('author_id',current.id);
    if(r.error){alert('تعذر حذف المنشور: '+r.error.message);return}
    closeMenus();
    if(typeof loadFeed==='function')await loadFeed();
  }
  document.addEventListener('click',async e=>{
    const action=e.target.closest('[data-post-action]');
    if(action){
      e.preventDefault();e.stopPropagation();
      const menuEl=action.closest('[data-post-menu]'),id=menuEl?.dataset.postMenu;
      if(action.dataset.postAction==='delete')await deletePost(id);
      else if(action.dataset.postAction==='copy'){
        const url=location.origin+location.pathname+'#post-'+id;
        try{await navigator.clipboard.writeText(url);alert('تم نسخ رابط المنشور')}catch{alert(url)}
        closeMenus();
      }
      return;
    }
    if(!e.target.closest('.post-more-wrap'))closeMenus();
  },true);
  const observer=new MutationObserver(()=>addMenus());
  function boot(){const feed=document.getElementById('feed');if(feed)observer.observe(feed,{childList:true,subtree:true});addMenus()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
