(()=>{
 const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
 const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
 const ini=n=>(n||'م').trim().charAt(0);
 let lastId='';
 function modalClose(){document.getElementById('closeModal')?.click()}
 function enhance(){
  const page=document.querySelector('#modal .profile-page'); if(!page)return;
  const id=window.__MADA_PROFILE_ID; if(!id||page.dataset.fbEnhanced===id)return; page.dataset.fbEnhanced=id; lastId=id;
  const main=page.querySelector('.profile-main'); if(!main)return;
  const title=page.querySelector('h2');
  const top=document.createElement('div'); top.className='fb-profile-top';
  top.innerHTML='<button type="button" class="fb-back" aria-label="رجوع">‹</button><b>الملف الشخصي</b><button type="button" class="fb-more" aria-label="المزيد">•••</button>';
  page.prepend(top);
  top.querySelector('.fb-back').onclick=modalClose;
  top.querySelector('.fb-more').onclick=()=>document.getElementById('menuBtn')?.click();
  if(title){title.classList.add('fb-profile-name');}
  const bio=page.querySelector('.profile-bio');
  const details=document.createElement('section'); details.className='fb-details card'; details.innerHTML='<h3>التفاصيل الشخصية</h3><div class="fb-detail-list"><div>📍 <span>جاري تحميل التفاصيل…</span></div></div>';
  const content=page.querySelector('.profile-content'); if(content)content.parentNode.insertBefore(details,content);
  const composer=document.createElement('section'); composer.className='fb-profile-composer card'; composer.innerHTML='<div class="fb-composer-row"><div class="fb-mini-avatar">'+ini(title?.textContent)+'</div><button type="button">بم تفكر؟</button></div><div class="fb-composer-actions"><button type="button">🖼️ صورة</button><button type="button">🎥 فيديو</button><button type="button">🎬 ريلز</button></div>';
  if(content)content.parentNode.insertBefore(composer,content);
  composer.querySelector('.fb-composer-row button').onclick=()=>{modalClose();setTimeout(()=>document.getElementById('createNav')?.click(),120)};
  composer.querySelectorAll('.fb-composer-actions button')[0].onclick=()=>{modalClose();setTimeout(()=>document.getElementById('photoBtn')?.click(),120)};
  composer.querySelectorAll('.fb-composer-actions button')[1].onclick=()=>{modalClose();setTimeout(()=>document.getElementById('videoBtn')?.click(),120)};
  composer.querySelectorAll('.fb-composer-actions button')[2].onclick=()=>{modalClose();setTimeout(()=>document.getElementById('reelsBtn')?.click(),120)};
  const posts=page.querySelector('#profilePosts'); if(posts){const h=document.createElement('h3');h.className='fb-section-title';h.textContent='كل المنشورات';posts.parentNode.insertBefore(h,posts)}
  loadDetails(id,details); loadFriends(id,page);
 }
 async function loadDetails(id,box){
  try{const r=await sb().from('profiles').select('*').eq('id',id).maybeSingle();const p=r.data||{};const list=[];
   if(p.location)list.push('📍 '+esc(p.location));
   else if(p.city)list.push('📍 '+esc(p.city));
   if(p.relationship_status)list.push('💗 '+esc(p.relationship_status));
   if(p.work)list.push('💼 '+esc(p.work));
   if(p.education)list.push('🎓 '+esc(p.education));
   if(p.created_at)list.push('📅 انضم إلى مدى في '+new Date(p.created_at).toLocaleDateString('ar-EG',{year:'numeric',month:'long'}));
   if(!list.length)list.push('ℹ️ لا توجد تفاصيل إضافية مضافة بعد.');
   box.querySelector('.fb-detail-list').innerHTML=list.map(x=>'<div><span>'+x+'</span></div>').join('');
  }catch(e){box.querySelector('.fb-detail-list').innerHTML='<div><span>ℹ️ لا توجد تفاصيل إضافية مضافة بعد.</span></div>'}
 }
 async function loadFriends(id,page){
  try{const[a,b]=await Promise.all([sb().from('friendships').select('addressee_id').eq('requester_id',id).eq('status','accepted'),sb().from('friendships').select('requester_id').eq('addressee_id',id).eq('status','accepted')]);const ids=[...new Set([...(a.data||[]).map(x=>x.addressee_id),...(b.data||[]).map(x=>x.requester_id)])].filter(x=>x&&x!==id).slice(0,6);const sec=document.createElement('section');sec.className='fb-friends card';sec.innerHTML='<div class="fb-section-head"><h3>الأصدقاء</h3><button type="button">عرض الكل</button></div>';
   const grid=document.createElement('div');grid.className='fb-friends-grid';
   if(ids.length){const r=await sb().from('profiles').select('id,display_name,avatar_url').in('id',ids);grid.innerHTML=(r.data||[]).map(p=>'<button type="button" data-friend="'+p.id+'"><span class="fb-friend-avatar">'+(p.avatar_url?'<img src="'+esc(p.avatar_url)+'">':ini(p.display_name))+'</span><b>'+esc(p.display_name||'مستخدم')+'</b></button>').join('')}
   else grid.innerHTML='<div class="empty">لا يوجد أصدقاء حتى الآن.</div>';
   sec.appendChild(grid);const content=page.querySelector('.profile-content');if(content)content.parentNode.insertBefore(sec,content);sec.querySelector('.fb-section-head button').onclick=()=>page.querySelector('#profileFriendsCount')?.click();grid.querySelectorAll('[data-friend]').forEach(b=>b.onclick=()=>window.ProfileUI?.open?.(b.dataset.friend));
  }catch(e){console.warn('profile friends',e)}
 }
 const obs=new MutationObserver(()=>enhance());
 const start=()=>{const m=document.getElementById('modal');if(m)obs.observe(m,{childList:true,subtree:true});enhance()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
