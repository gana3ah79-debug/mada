/* Mada post menu: three-dot actions on the left side of every post. */
(function(){
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const getUser=()=>window.user||(typeof user!=='undefined'?user:null);
  const getSb=()=>window.sb||(typeof sb!=='undefined'?sb:null)||window.MADA_SUPABASE_CLIENT;
  function closeMenus(){document.querySelectorAll('.mada-post-menu').forEach(x=>x.remove())}
  function addMenus(){
    document.querySelectorAll('#feed article.post[id^="post-"]').forEach(article=>{
      if(article.querySelector('.post-more'))return;
      const id=article.id.slice(5),head=article.querySelector('.post-head');
      if(!head)return;
      const wrap=document.createElement('div');
      wrap.className='post-more-wrap';
      wrap.innerHTML='<button class="post-more" type="button" aria-label="المزيد من خيارات المنشور" aria-expanded="false">⋯</button>';
      head.appendChild(wrap);
      const btn=wrap.querySelector('.post-more');
      btn.addEventListener('click',async e=>{
        e.preventDefault();e.stopPropagation();
        const existing=wrap.querySelector('.mada-post-menu');
        if(existing){closeMenus();btn.setAttribute('aria-expanded','false');return}
        closeMenus();
        const current=getUser();
        const authorId=article.querySelector('[data-profile]')?.dataset.profile;
        const mine=!!current&&authorId===current.id;
        const copy=`<button type="button" data-post-action="copy">🔗 نسخ رابط المنشور</button>`;
        const del=mine?`<button type="button" class="danger" data-post-action="delete">🗑️ حذف المنشور</button>`:'';
        wrap.insertAdjacentHTML('beforeend',`<div class="mada-post-menu" data-post-menu="${esc(id)}" role="menu">${copy}${del}</div>`);
        btn.setAttribute('aria-expanded','true');
      });
    });
  }
  async function deletePost(id){
    const current=getUser(),client=getSb();
    if(!current||!client){alert('الجلسة غير متاحة، أعد تسجيل الدخول.');return}
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
  function boot(){
    const feed=document.getElementById('feed');
    if(feed)observer.observe(feed,{childList:true,subtree:true});
    addMenus();
    setInterval(addMenus,1000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
