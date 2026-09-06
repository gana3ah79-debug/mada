/* Mada post menu v3 — reliable full actions menu. */
(function(){
  'use strict';
  if(window.__MADA_POST_MENU_V3)return;
  window.__MADA_POST_MENU_V3=true;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const getUser=()=>window.user||(typeof user!=='undefined'?user:null);
  const getSb=()=>window.sb||(typeof sb!=='undefined'?sb:null)||window.MADA_SUPABASE_CLIENT;
  const key=(type,id)=>`mada_${type}_${id}`;
  const read=(type,id)=>{try{return localStorage.getItem(key(type,id))==='1'}catch{return false}};
  const write=(type,id,v)=>{try{v?localStorage.setItem(key(type,id),'1'):localStorage.removeItem(key(type,id))}catch{}};
  const css=`
  .mada-menu-v3{position:fixed!important;z-index:2147483000!important;display:flex!important;flex-direction:column!important;gap:2px!important;width:190px!important;max-width:calc(100vw - 24px)!important;box-sizing:border-box!important;padding:5px!important;margin:0!important;background:#fff!important;color:#1e293b!important;border:1px solid #e2e8f0!important;border-radius:13px!important;box-shadow:0 12px 30px rgba(15,23,42,.18)!important;overflow:visible!important;direction:rtl!important}
  .mada-menu-v3 button{display:flex!important;visibility:visible!important;opacity:1!important;position:relative!important;align-items:center!important;justify-content:flex-start!important;width:100%!important;height:auto!important;min-height:36px!important;max-height:none!important;box-sizing:border-box!important;padding:6px 9px!important;margin:0!important;border:0!important;border-radius:9px!important;background:#fff!important;color:#1e293b!important;font:700 12.5px/1.25 inherit!important;text-align:right!important;white-space:normal!important;overflow:visible!important;cursor:pointer!important}
  .mada-menu-v3 button:hover{background:#f1f5f9!important}.mada-menu-v3 button:active{background:#e2e8f0!important;transform:none!important}.mada-menu-v3 button.danger{color:#dc2626!important}
  @media(max-width:600px){.mada-menu-v3{width:178px!important;padding:4px!important;border-radius:12px!important}.mada-menu-v3 button{min-height:34px!important;padding:5px 8px!important;font-size:11.5px!important}}
  `;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  let open=null;
  function close(){if(open){open.remove();open=null}document.querySelectorAll('.post-more[aria-expanded="true"]').forEach(b=>b.setAttribute('aria-expanded','false'))}
  function getAuthorId(article){return article?.dataset?.authorId||article?.querySelector('[data-profile]')?.dataset?.profile||''}
  function styleButton(b){b.style.setProperty('display','flex','important');b.style.setProperty('visibility','visible','important');b.style.setProperty('opacity','1','important');b.style.setProperty('min-height','34px','important');b.style.setProperty('height','auto','important');b.style.setProperty('overflow','visible','important');b.style.setProperty('background','#fff','important');b.style.setProperty('color',b.classList.contains('danger')?'#dc2626':'#1e293b','important')}
  function openMenu(article,btn){
    close();
    const id=article.id.slice(5),current=getUser(),authorId=getAuthorId(article),mine=!!current&&authorId===current.id;
    const saved=read('saved',id),hidden=read('hidden',id);
    const menu=document.createElement('div');menu.className='mada-menu-v3';menu.dataset.postMenu=id;menu.setAttribute('role','menu');
    const items=[];
    if(mine)items.push(['edit','✏️ تعديل المنشور',false]);
    items.push(['save',saved?'🔖 إلغاء حفظ المنشور':'🔖 حفظ المنشور',false]);
    items.push(['hide',hidden?'👁️ إظهار المنشور':'🙈 إخفاء المنشور',false]);
    if(!mine)items.push(['report','🚩 الإبلاغ عن المنشور',false]);
    items.push(['copy','🔗 نسخ رابط المنشور',false]);
    if(mine)items.push(['delete','🗑️ حذف المنشور',true]);
    items.forEach(([type,label,danger])=>{const b=document.createElement('button');b.type='button';b.dataset.postAction=type;b.textContent=label;if(danger)b.className='danger';styleButton(b);menu.appendChild(b)});
    document.body.appendChild(menu);open=menu;
    const r=btn.getBoundingClientRect(),mw=menu.offsetWidth,mh=menu.offsetHeight;
    let left=r.right-mw,top=r.bottom+6;
    if(left<12)left=12;if(left+mw>innerWidth-12)left=innerWidth-mw-12;
    if(top+mh>innerHeight-12&&r.top-mh-6>12)top=r.top-mh-6;
    menu.style.left=left+'px';menu.style.top=top+'px';btn.setAttribute('aria-expanded','true');
  }
  function removePost(id){const a=document.getElementById('post-'+id);if(a){a.style.display='none';a.dataset.madaHidden='1'}}
  function restoreHidden(){document.querySelectorAll('#feed article.post[id^="post-"]').forEach(a=>{const id=a.id.slice(5);if(read('hidden',id)){a.style.display='none';a.dataset.madaHidden='1'}})}
  function addMenus(){document.querySelectorAll('#feed article.post[id^="post-"]').forEach(article=>{
    if(article.querySelector('.post-more'))return;const head=article.querySelector('.post-head');if(!head)return;const id=article.id.slice(5),authorId=getAuthorId(article);article.dataset.authorId=authorId;
    const wrap=document.createElement('div');wrap.className='post-more-wrap';wrap.innerHTML='<button class="post-more" type="button" aria-label="المزيد من خيارات المنشور" aria-expanded="false">⋯</button>';head.appendChild(wrap);
    const btn=wrap.querySelector('.post-more');btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(open){close();return}openMenu(article,btn)});
  });restoreHidden()}
  async function deletePost(id){const current=getUser(),client=getSb();if(!current||!client){alert('الجلسة غير متاحة، أعد تسجيل الدخول.');return}if(!confirm('هل أنت متأكد من حذف هذا المنشور؟\nسيتم حذفه نهائيًا.'))return;const r=await client.from('posts').delete().eq('id',id).eq('author_id',current.id);if(r.error){alert('تعذر حذف المنشور: '+r.error.message);return}close();if(typeof loadFeed==='function')await loadFeed()}
  async function editPost(id){const current=getUser(),client=getSb();if(!current||!client)return;const article=document.getElementById('post-'+id),old=article?.querySelector('.post-text')?.textContent||'';const value=prompt('عدّل نص المنشور:',old);if(value===null)return;const r=await client.from('posts').update({body:value.trim(),updated_at:new Date().toISOString()}).eq('id',id).eq('author_id',current.id);if(r.error){alert('تعذر تعديل المنشور: '+r.error.message);return}close();if(typeof loadFeed==='function')await loadFeed()}
  async function reportPost(id){const current=getUser(),client=getSb();if(!current||!client){alert('سجّل الدخول أولاً.');return}const reason=prompt('سبب الإبلاغ عن المنشور:\nمثال: محتوى مخالف أو إساءة أو احتيال');if(!reason?.trim())return;const article=document.getElementById('post-'+id),reported=article?.dataset?.authorId||null;const r=await client.from('reports').insert({reporter_id:current.id,post_id:id,reported_user_id:reported,reason:reason.trim(),status:'pending'});if(r.error){alert('تعذر إرسال البلاغ: '+r.error.message);return}close();alert('تم إرسال البلاغ للمراجعة ✓')}
  document.addEventListener('click',async e=>{const action=e.target.closest?.('[data-post-action]');if(action&&action.closest('.mada-menu-v3')){e.preventDefault();e.stopPropagation();const id=action.closest('.mada-menu-v3').dataset.postMenu,type=action.dataset.postAction;if(type==='delete')await deletePost(id);else if(type==='edit')await editPost(id);else if(type==='save'){const next=!read('saved',id);write('saved',id,next);close();alert(next?'تم حفظ المنشور ✓':'تم إلغاء حفظ المنشور ✓')}else if(type==='hide'){const next=!read('hidden',id);write('hidden',id,next);close();if(next){removePost(id);alert('تم إخفاء المنشور ✓')}else{const a=document.getElementById('post-'+id);if(a)a.style.display='';alert('تم إظهار المنشور ✓')}}else if(type==='report')await reportPost(id);else if(type==='copy'){const url=location.origin+location.pathname+'#post-'+id;try{await navigator.clipboard.writeText(url);alert('تم نسخ رابط المنشور')}catch{prompt('رابط المنشور:',url)}close()}return}if(!e.target.closest?.('.post-more-wrap')&&!e.target.closest?.('.mada-menu-v3'))close()},true);
  document.addEventListener('scroll',close,true);window.addEventListener('resize',close);
  const observer=new MutationObserver(addMenus);function boot(){addMenus();const feed=document.getElementById('feed');if(feed)observer.observe(feed,{childList:true,subtree:true});setInterval(addMenus,1200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
