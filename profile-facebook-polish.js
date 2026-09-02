(()=>{
 const modal=()=>document.getElementById('modal');
 const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
 const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
 let busy=false,lastPage=null,lastId='';
 function injectExactStyle(){
  if(document.getElementById('mada-fb-exact-style'))return;
  const s=document.createElement('style');s.id='mada-fb-exact-style';s.textContent=`
   .fb-profile-modal .profile-page{font-family:Arial,Tahoma,sans-serif!important;background:#fff!important;color:#171717!important}
   .fb-profile-modal .profile-main{padding:0 12px 12px!important;text-align:right!important}
   .fb-profile-modal .profile-page .cover{height:112px!important;background:#e9edf2!important}
   .fb-profile-modal .profile-avatar{width:92px!important;height:92px!important;margin:-46px 0 5px auto!important;border:4px solid #fff!important;font-size:30px!important}
   .fb-profile-modal .profile-page h2{font-size:22px!important;font-weight:800!important;margin:0 0 2px!important}
   .fb-profile-modal .profile-bio{font-size:14px!important;line-height:1.5!important;margin:0 0 4px!important;color:#656d78!important}
   .fb-profile-modal .profile-stats{display:flex!important;gap:18px!important;justify-content:flex-start!important;margin:2px 0!important;padding:0!important}
   .fb-profile-modal .profile-stats>button{padding:2px 0!important;background:transparent!important}
   .fb-profile-modal .profile-stats b{font-size:16px!important;font-weight:800!important}.fb-profile-modal .profile-stats span{font-size:12px!important}
   .fb-profile-modal .profile-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:6px!important;margin-top:7px!important}
   .fb-profile-modal .profile-actions button{min-width:0!important;width:100%!important;min-height:38px!important;height:38px!important;border-radius:7px!important;font-size:13px!important;font-weight:800!important;padding:6px!important}
   .fb-profile-modal .profile-actions button:last-child{grid-column:1/-1}
   .fb-profile-modal .profile-actions .primary{background:#1877f2!important;color:#fff!important}.fb-profile-modal .profile-actions .profile-pill{background:#e4e6eb!important;color:#172033!important}
   .fb-profile-modal .profile-tabs{margin-top:5px!important;position:sticky!important;top:0!important;background:#fff!important;border-top:1px solid #e4e6eb!important;border-bottom:1px solid #ddd!important;z-index:7}
   .fb-profile-modal .profile-tabs button{font-size:14px!important;padding:10px 5px!important;color:#65676b!important}.fb-profile-modal .profile-tabs .active{color:#1877f2!important}
   .fb-details,.fb-friends,.fb-profile-composer{margin:0!important;padding:12px!important;border:0!important;border-top:7px solid #f0f2f5!important;border-radius:0!important;box-shadow:none!important}
   .fb-details h3,.fb-friends h3{font-size:18px!important;margin:0 0 8px!important}.fb-detail-list>div{font-size:15px!important;padding:4px 0!important}
   .fb-friends-grid{gap:9px!important;overflow:hidden!important}.fb-friends-grid>button{width:74px!important;min-width:74px!important}.fb-friend-avatar{width:74px!important;height:74px!important}.fb-friends-grid b{font-size:12px!important}
   .fb-profile-composer{padding:10px 12px!important}.fb-composer-row button{font-size:15px!important;padding:9px 12px!important}.fb-composer-actions button{font-size:13px!important;padding:8px!important}
   .fb-section-title,.fb-shared-section h3{font-size:18px!important;padding:10px 12px 5px!important;border-top:7px solid #f0f2f5!important}
   .profile-content{padding:0!important}.profile-post{border-top:7px solid #f0f2f5!important}.profile-post-head{padding:9px 12px 5px!important}.profile-post .post-text{font-size:16px!important;line-height:1.7!important;padding:5px 12px 9px!important}.profile-post .post-actions button{font-size:13px!important}
   .fb-share-item{padding:9px 12px 11px!important}.fb-share-label{font-size:13px!important}.fb-share-author{font-size:14px!important}.fb-share-text{font-size:16px!important}
   @media(max-width:600px){.fb-profile-modal .profile-page .cover{height:96px!important}.fb-profile-modal .profile-avatar{width:86px!important;height:86px!important;margin-top:-43px!important}.fb-profile-modal .profile-page h2{font-size:21px!important}.fb-profile-modal .profile-bio{font-size:14px!important}.fb-profile-modal .profile-actions button{font-size:13px!important}.fb-friend-avatar,.fb-friends-grid>button{width:68px!important;min-width:68px!important}.fb-friend-avatar{height:68px!important}}
  `;document.head.appendChild(s);
 }
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
   const content=page.querySelector('.profile-content');if(content)content.parentNode.insertBefore(sec,content);else page.appendChild(sec);lastPage=page;lastId=id;
  }finally{busy=false}
 }
 function polish(){
  injectExactStyle();
  const m=modal(),page=m?.querySelector('.profile-page');if(!m||!page)return;
  m.querySelector('.modal-card')?.classList.add('fb-profile-modal');
  const roots=m.querySelectorAll('#modalBody>.profile-page');roots.forEach((x,i)=>{if(i)x.remove()});
  const top=page.querySelector('.fb-profile-top');if(top){top.querySelector('b')?.remove();top.style.justifyContent='flex-start'}
  const id=window.__MADA_PROFILE_ID,me=window.user?.id;
  if(id&&me&&id===me&&page.querySelector('#editProfile')&&!page.querySelector('#addStoryProfile')){
   const edit=page.querySelector('#editProfile');const story=document.createElement('button');story.id='addStoryProfile';story.type='button';story.className='profile-pill';story.textContent='➕ إضافة إلى القصة';edit.parentNode.insertBefore(story,edit);story.onclick=()=>{m.querySelector('#closeModal')?.click();setTimeout(()=>window.MadaStoriesReels?.create?.('story'),120)};
  }
  sharedPosts(page,id);
 }
 const start=()=>{const m=modal();if(m)new MutationObserver(()=>setTimeout(polish,80)).observe(m,{childList:true,subtree:true});polish()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
