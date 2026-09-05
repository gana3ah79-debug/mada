/* Mada emergency profile opener: renders the profile shell first and never blocks on secondary queries. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const ini=n=>(n||'م').trim().charAt(0);
  const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  const timeout=(p,ms=3500)=>Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))]);
  const show=(t,b)=>window.showModal?.(t,b);
  let oldOpen=null;
  async function safeOpen(id){
    const s=sb(), me=window.user;
    if(!s||!me)return;
    id=id||me.id;
    window.__MADA_PROFILE_ID=id;
    show('👤 الملف الشخصي','<div class="profile-page profile-loading"><div class="profile-loading-avatar"></div><div class="profile-loading-line"></div><div class="profile-loading-line short"></div><div class="empty">جاري فتح الملف الشخصي…</div></div>');
    let p;
    try{
      const r=await timeout(s.from('profiles').select('id,display_name,username,bio,avatar_url,cover_url,role,created_at').eq('id',id).maybeSingle(),3500);
      if(r.error||!r.data)throw r.error||new Error('profile not found');
      p=r.data;
    }catch(e){
      console.warn('Mada safe profile',e);
      show('👤 الملف الشخصي','<div class="empty">تعذر تحميل الملف الشخصي الآن.<br><small>حاول مرة أخرى بعد لحظات.</small></div>');
      return;
    }
    const own=id===me.id;
    show('👤 الملف الشخصي',`<div class="mada-safe-profile">
      <div class="mada-safe-cover" style="background-image:url('${esc(p.cover_url||'')}')"></div>
      <div class="mada-safe-main">
        <div class="mada-safe-avatar">${p.avatar_url?`<img src="${esc(p.avatar_url)}" alt="">`:ini(p.display_name)}</div>
        <h2>${esc(p.display_name||'مستخدم Mada')} ${p.role==='admin'?'👑':''}</h2>
        ${p.username?`<div class="mada-safe-username">@${esc(p.username)}</div>`:''}
        <p class="mada-safe-bio">${esc(p.bio||'لا توجد نبذة حتى الآن.')}</p>
        <div class="mada-safe-actions">${own?'<button id="madaSafeEdit" class="primary wide">✏️ تعديل الملف</button>':'<button id="madaSafeFriend" class="primary">👥 إضافة صديق</button><button id="madaSafeMessage" class="profile-pill">💬 رسالة</button>'}</div>
      </div>
      <div class="mada-safe-stats"><div><b id="safePosts">—</b><span>منشور</span></div><div><b id="safeFriends">—</b><span>أصدقاء</span></div><div><b id="safeFollowers">—</b><span>متابعون</span></div></div>
      <div class="profile-tabs"><button id="safeTabPosts" class="active">المنشورات</button><button id="safeTabPhotos">الصور</button></div>
      <div id="safePostsBox" class="mada-safe-posts"><div class="empty">جاري تحميل المنشورات…</div></div>
      <div id="safePhotosBox" class="profile-photos" hidden><div class="empty">جاري تحميل الصور…</div></div>
    </div>`);
    const root=$('modalBody');
    root.querySelector('#safeTabPosts').onclick=()=>{root.querySelector('#safeTabPosts').classList.add('active');root.querySelector('#safeTabPhotos').classList.remove('active');root.querySelector('#safePostsBox').hidden=false;root.querySelector('#safePhotosBox').hidden=true};
    root.querySelector('#safeTabPhotos').onclick=()=>{root.querySelector('#safeTabPhotos').classList.add('active');root.querySelector('#safeTabPosts').classList.remove('active');root.querySelector('#safePostsBox').hidden=true;root.querySelector('#safePhotosBox').hidden=false};
    root.querySelector('#madaSafeEdit')?.addEventListener('click',()=>oldOpen?.edit?.());
    root.querySelector('#madaSafeMessage')?.addEventListener('click',()=>window.openChat?.(id));
    root.querySelector('#madaSafeFriend')?.addEventListener('click',()=>oldOpen?.sendFriendRequest?.(id));
    const counts=await Promise.allSettled([
      timeout(s.from('posts').select('id',{count:'exact',head:true}).eq('author_id',id),2200),
      timeout(s.from('friendships').select('id',{count:'exact',head:true}).or(`and(requester_id.eq.${id},status.eq.accepted),and(addressee_id.eq.${id},status.eq.accepted)`),2200),
      timeout(s.from('follows').select('id',{count:'exact',head:true}).eq('following_id',id),2200)
    ]);
    const val=i=>counts[i].status==='fulfilled'?(counts[i].value.count||0):'—';
    if($('safePosts'))$('safePosts').textContent=val(0);if($('safeFriends'))$('safeFriends').textContent=val(1);if($('safeFollowers'))$('safeFollowers').textContent=val(2);
    try{
      const r=await timeout(s.from('posts').select('id,body,media_url,created_at').eq('author_id',id).order('created_at',{ascending:false}).limit(12),3500);
      const posts=r.data||[];
      const pb=$('safePostsBox'), ph=$('safePhotosBox');
      if(pb)pb.innerHTML=posts.length?posts.map(x=>`<article class="card post mada-safe-post"><div class="post-text">${esc(x.body||'')}</div>${x.media_url?`<img class="post-image" src="${esc(x.media_url)}" alt="صورة المنشور" loading="lazy">`:''}<div class="post-time">${esc(new Date(x.created_at).toLocaleString('ar-EG'))}</div></article>`).join(''):'<div class="empty">لا توجد منشورات بعد.</div>';
      const imgs=posts.map(x=>x.media_url).filter(Boolean);
      if(ph)ph.innerHTML=imgs.length?imgs.map(u=>`<img src="${esc(u)}" alt="صورة" loading="lazy">`).join(''):'<div class="empty">لا توجد صور.</div>';
    }catch(e){
      console.warn('Mada safe profile posts',e);
      if($('safePostsBox'))$('safePostsBox').innerHTML='<div class="empty">تم فتح الملف الشخصي، وتعذر تحميل المنشورات حاليًا.</div>';
      if($('safePhotosBox'))$('safePhotosBox').innerHTML='<div class="empty">لا يمكن تحميل الصور الآن.</div>';
    }
  }
  function install(){
    if(!window.ProfileUI||typeof window.ProfileUI.open!=='function')return setTimeout(install,250);
    oldOpen=window.ProfileUI;
    window.ProfileUI.open=safeOpen;
    window.__MADA_PROFILE_SAFE_OPEN__=true;
  }
  install();
})();