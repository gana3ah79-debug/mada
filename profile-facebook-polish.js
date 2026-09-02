(()=>{
 const modal=()=>document.getElementById('modal');
 const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
 const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
 let busy=false,lastPage=null,lastId='';
 async function sharedPosts(page,id){
  if(busy||!page||!id)return;
  if(page.querySelector('.fb-shared-section')&&lastPage===page&&lastId===id)return;
  busy=true;
  try{
   const r=await sb().from('post_shares').select('post_id,user_id,target_user_id,created_at').eq('target_user_id',id).order('created_at',{ascending:false}).limit(30);
   const shares=r.data||[];if(!shares.length)return;
   const ids=[...new Set(shares.map(x=>x.post_id).filter(Boolean))];
   const pr=await sb().from('posts').select('id,author_id,body,media_url,created_at').in('id',ids);const posts=pr.data||[];if(!posts.length)return;
   const aids=[...new Set(posts.map(x=>x.author_id).filter(Boolean))];const ar=aids.length?await sb().from('profiles').select('id,display_name,avatar_url').in('id',aids):{data:[]};
   const am=new Map((ar.data||[]).map(x=>[x.id,x])),pm=new Map(posts.map(x=>[x.id,x]));
   const rows=shares.map(s=>{const p=pm.get(s.post_id),a=p&&am.get(p.author_id);return p?`<article class="fb-share-item"><div class="fb-share-label">↗️ مشاركة</div><div class="fb-share-author"><span>${a?.avatar_url?`<img src="${esc(a.avatar_url)}">`:esc((a?.display_name||'مستخدم').trim().charAt(0))}</span><b>${esc(a?.display_name||'مستخدم Mada')}</b><small> · مشاركة داخل الملف الشخصي</small></div>${p.body?`<div class="fb-share-text">${esc(p.body)}</div>`:''}${p.media_url?`<img src="${esc(p.media_url)}" alt="" loading="lazy">`:''}</article>`:''}).filter(Boolean).join('');
   if(!rows)return;
   const sec=document.createElement('section');sec.className='fb-shared-section';sec.innerHTML='<h3>المنشورات</h3>'+rows;
   const content=page.querySelector('.profile-content');
   if(content)content.parentNode.insertBefore(sec,content);else page.appendChild(sec);
   lastPage=page;lastId=id;
  }finally{busy=false}
 }
 function polish(){
  const m=modal(),page=m?.querySelector('.profile-page'); if(!m||!page)return;
  m.querySelector('.modal-card')?.classList.add('fb-profile-modal');
  /* keep only one profile root if another script accidentally appended a second */
  const roots=m.querySelectorAll('#modalBody>.profile-page');roots.forEach((x,i)=>{if(i)x.remove()});
  const top=page.querySelector('.fb-profile-top'); if(top){top.querySelector('b')?.remove();top.style.justifyContent='flex-start'}
  const id=window.__MADA_PROFILE_ID,me=window.user?.id;
  if(id&&me&&id===me&&page.querySelector('#editProfile')&&!page.querySelector('#addStoryProfile')){
   const edit=page.querySelector('#editProfile');
   const story=document.createElement('button');story.id='addStoryProfile';story.type='button';story.className='profile-pill';story.textContent='➕ إضافة إلى القصة';
   edit.parentNode.insertBefore(story,edit);
   story.onclick=()=>{m.querySelector('#closeModal')?.click();setTimeout(()=>window.MadaStoriesReels?.create?.('story'),120)};
  }
  sharedPosts(page,id);
 }
 const start=()=>{const m=modal();if(m)new MutationObserver(()=>setTimeout(polish,80)).observe(m,{childList:true,subtree:true});polish()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
