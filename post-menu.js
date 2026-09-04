/* Mada post menu: Facebook-like actions. */
(function(){
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const getUser=()=>window.user||(typeof user!=='undefined'?user:null);
  const getSb=()=>window.sb||(typeof sb!=='undefined'?sb:null)||window.MADA_SUPABASE_CLIENT;
  const key=(type,id)=>`mada_${type}_${id}`;
  const read=(type,id)=>{try{return localStorage.getItem(key(type,id))==='1'}catch{return false}};
  const write=(type,id,v)=>{try{v?localStorage.setItem(key(type,id),'1'):localStorage.removeItem(key(type,id))}catch{}};
  function styleMenu(menu){
    menu.style.background='#fff';menu.style.color='#27344a';menu.style.borderColor='#e3e8ef';
    menu.querySelectorAll('button').forEach(b=>{b.style.background='transparent';b.style.color=b.classList.contains('danger')?'#d9363e':'#27344a'});
  }
  function closeMenus(){document.querySelectorAll('.mada-post-menu').forEach(x=>x.remove());document.querySelectorAll('.post-more[aria-expanded="true"]').forEach(x=>x.setAttribute('aria-expanded','false'))}
  function getAuthorId(article){return article?.dataset?.authorId||article?.querySelector('[data-profile]')?.dataset?.profile||''}
  function removePost(id){const a=document.getElementById('post-'+id);if(a){a.style.display='none';a.dataset.madaHidden='1'}}
  function restoreHidden(){document.querySelectorAll('#feed article.post[id^="post-"]').forEach(a=>{const id=a.id.slice(5);if(read('hidden',id)){a.style.display='none';a.dataset.madaHidden='1'}})}
  function addMenus(){
    document.querySelectorAll('#feed article.post[id^="post-"]').forEach(article=>{
      if(article.querySelector('.post-more'))return;
      const id=article.id.slice(5),head=article.querySelector('.post-head');if(!head)return;
      const authorId=getAuthorId(article);article.dataset.authorId=authorId;
      const wrap=document.createElement('div');wrap.className='post-more-wrap';
      wrap.innerHTML='<button class="post-more" type="button" aria-label="المزيد من خيارات المنشور" aria-expanded="false">⋯</button>';head.appendChild(wrap);
      const btn=wrap.querySelector('.post-more');
      btn.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();if(wrap.querySelector('.mada-post-menu')){closeMenus();return}closeMenus();
        const current=getUser(),mine=!!current&&authorId===current.id,saved=read('saved',id),hidden=read('hidden',id);
        const edit=mine?'<button type="button" data-post-action="edit">✏️ تعديل المنشور</button>':'';
        const del=mine?'<button type="button" class="danger" data-post-action="delete">🗑️ حذف المنشور</button>':'';
        const save=`<button type="button" data-post-action="save">${saved?'🔖 إلغاء حفظ المنشور':'🔖 حفظ المنشور'}</button>`;
        const hide=`<button type="button" data-post-action="hide">🙈 ${hidden?'إظهار المنشور':'إخفاء المنشور'}</button>`;
        const report=mine?'':'<button type="button" data-post-action="report">🚩 الإبلاغ عن المنشور</button>';
        const copy='<button type="button" data-post-action="copy">🔗 نسخ رابط المنشور</button>';
        wrap.insertAdjacentHTML('beforeend',`<div class="mada-post-menu" data-post-menu="${esc(id)}" role="menu">${edit}${save}${hide}${report}${copy}${del}</div>`);
        btn.setAttribute('aria-expanded','true');styleMenu(wrap.querySelector('.mada-post-menu'));
      });
    });
    restoreHidden();
  }
  async function deletePost(id){
    const current=getUser(),client=getSb();if(!current||!client){alert('الجلسة غير متاحة، أعد تسجيل الدخول.');return}
    if(!confirm('هل أنت متأكد من حذف هذا المنشور؟\nسيتم حذفه نهائيًا.'))return;
    const r=await client.from('posts').delete().eq('id',id).eq('author_id',current.id);if(r.error){alert('تعذر حذف المنشور: '+r.error.message);return}
    closeMenus();if(typeof loadFeed==='function')await loadFeed();
  }
  async function editPost(id){
    const current=getUser(),client=getSb();if(!current||!client)return;
    const article=document.getElementById('post-'+id);const old=article?.querySelector('.post-text')?.textContent||'';
    const value=prompt('عدّل نص المنشور:',old);if(value===null)return;
    const r=await client.from('posts').update({body:value.trim(),updated_at:new Date().toISOString()}).eq('id',id).eq('author_id',current.id);
    if(r.error){alert('تعذر تعديل المنشور: '+r.error.message);return}closeMenus();if(typeof loadFeed==='function')await loadFeed();
  }
  async function reportPost(id){
    const current=getUser(),client=getSb();if(!current||!client){alert('سجّل الدخول أولاً.');return}
    const reason=prompt('سبب الإبلاغ عن المنشور:\nمثال: محتوى مخالف أو إساءة أو احتيال');if(!reason?.trim())return;
    const article=document.getElementById('post-'+id),reported=article?.dataset?.authorId||null;
    const r=await client.from('reports').insert({reporter_id:current.id,post_id:id,reported_user_id:reported,reason:reason.trim(),status:'pending'});
    if(r.error){alert('تعذر إرسال البلاغ: '+r.error.message);return}closeMenus();alert('تم إرسال البلاغ للمراجعة ✓');
  }
  document.addEventListener('click',async e=>{
    const action=e.target.closest('[data-post-action]');
    if(action){e.preventDefault();e.stopPropagation();const menuEl=action.closest('[data-post-menu]'),id=menuEl?.dataset.postMenu;if(!id)return;
      const type=action.dataset.postAction;
      if(type==='delete')await deletePost(id);
      else if(type==='edit')await editPost(id);
      else if(type==='save'){const next=!read('saved',id);write('saved',id,next);closeMenus();alert(next?'تم حفظ المنشور ✓':'تم إلغاء حفظ المنشور ✓')}
      else if(type==='hide'){const next=!read('hidden',id);write('hidden',id,next);closeMenus();if(next){removePost(id);alert('تم إخفاء المنشور ✓')}else{const a=document.getElementById('post-'+id);if(a)a.style.display='';alert('تم إظهار المنشور ✓')}}
      else if(type==='report')await reportPost(id);
      else if(type==='copy'){const url=location.origin+location.pathname+'#post-'+id;try{await navigator.clipboard.writeText(url);alert('تم نسخ رابط المنشور')}catch{alert(url)}closeMenus()}
      return;
    }
    if(!e.target.closest('.post-more-wrap'))closeMenus();
  },true);
  const observer=new MutationObserver(()=>addMenus());
  function boot(){const feed=document.getElementById('feed');if(feed)observer.observe(feed,{childList:true,subtree:true});addMenus();setInterval(addMenus,1000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
