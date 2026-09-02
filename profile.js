const ProfileUI=(()=>{
  const {createClient}=window.supabase;
  const sb=window.MADA_SUPABASE_CLIENT||createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
  let me=null; let openSeq=0; const BUCKET='profile-images'; const cache=new Map(); const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const ini=n=>(n||'م').trim().charAt(0), fmt=d=>new Date(d).toLocaleString('ar-EG');
  const show=(t,b)=>window.showModal?showModal(t,b):null;

  function compress(file,maxSide=1600,quality=.82){return new Promise((resolve,reject)=>{if(!file||!file.type.startsWith('image/'))return reject(new Error('اختر صورة صحيحة'));const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{let w=img.naturalWidth,h=img.naturalHeight,s=Math.min(1,maxSide/Math.max(w,h));w=Math.max(1,Math.round(w*s));h=Math.max(1,Math.round(h*s));const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);URL.revokeObjectURL(url);c.toBlob(b=>b?resolve(b):reject(new Error('تعذر ضغط الصورة')),'image/jpeg',quality)};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('تعذر قراءة الصورة'))};img.src=url})}
  async function uploadProfileImage(file,type){const blob=await compress(file,type==='cover'?2000:1200,.82),path=`${me.id}/profile-${type}-${crypto.randomUUID()}.jpg`;const up=await sb.storage.from(BUCKET).upload(path,blob,{contentType:'image/jpeg',upsert:false,cacheControl:'31536000'});if(up.error)throw up.error;return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl}

  async function counts(id){
    const cached=cache.get('counts:'+id); if(cached)return cached;
    const promise=Promise.all([
      sb.from('friendships').select('*',{count:'exact',head:true}).or(`and(requester_id.eq.${id},status.eq.accepted),and(addressee_id.eq.${id},status.eq.accepted)`),
      sb.from('follows').select('*',{count:'exact',head:true}).eq('following_id',id),
      sb.from('posts').select('*',{count:'exact',head:true}).eq('author_id',id)
    ]).then(([f,fol,p])=>({friends:f.count||0,followers:fol.count||0,posts:p.count||0}));
    cache.set('counts:'+id,promise); return promise;
  }

  async function relation(id){
    if(id===me.id)return{self:true};
    const [fr,fo]=await Promise.all([
      sb.from('friendships').select('id,requester_id,addressee_id,status').or(`and(requester_id.eq.${me.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${me.id})`).maybeSingle(),
      sb.from('follows').select('follower_id,following_id').eq('follower_id',me.id).eq('following_id',id).maybeSingle()
    ]);
    return{fr:fr.data||null,follow:!!fo.data};
  }

  async function postData(id){
    const [ownRes,shareRes]=await Promise.all([
      sb.from('posts').select('id,author_id,body,media_url,created_at,updated_at').eq('author_id',id).order('created_at',{ascending:false}).limit(30),
      sb.from('post_shares').select('id,post_id,user_id,target_user_id,created_at').eq('target_user_id',id).order('created_at',{ascending:false}).limit(30)
    ]);
    const own=ownRes.data||[], shares=shareRes.data||[];
    const shareIds=[...new Set(shares.map(x=>x.post_id).filter(Boolean))];
    const extraIds=shareIds.filter(pid=>!own.some(p=>p.id===pid));
    const extra=extraIds.length?(await sb.from('posts').select('id,author_id,body,media_url,created_at,updated_at').in('id',extraIds)).data||[]:[];
    const all=[...own,...extra];
    if(!all.length)return[];
    const ids=all.map(x=>x.id);
    const [lr,cr,pr]=await Promise.all([
      sb.from('post_likes').select('post_id,user_id').in('post_id',ids),
      sb.from('comments').select('id,post_id,author_id,body,created_at').in('post_id',ids).order('created_at',{ascending:true}),
      sb.from('profiles').select('id,display_name,avatar_url').in('id',[...new Set(all.map(x=>x.author_id).filter(Boolean))])
    ]);
    const commentIds=[...new Set((cr.data||[]).map(x=>x.author_id).filter(Boolean))];
    const cp=commentIds.length?(await sb.from('profiles').select('id,display_name,avatar_url').in('id',commentIds)).data||[]:[];
    const pm=new Map((pr.data||[]).map(x=>[x.id,x])); const cm=new Map(cp.map(x=>[x.id,x]));
    const shareMap=new Map(); shares.forEach(s=>{if(!shareMap.has(s.post_id))shareMap.set(s.post_id,[]);shareMap.get(s.post_id).push(s)});
    const items=[];
    own.forEach(p=>items.push({p,likes:(lr.data||[]).filter(x=>x.post_id===p.id),comments:(cr.data||[]).filter(x=>x.post_id===p.id),am:cm,author:pm.get(p.author_id),shared:false,sortAt:p.created_at}));
    shares.forEach(s=>{const p=all.find(x=>x.id===s.post_id);if(!p)return;items.push({p,likes:(lr.data||[]).filter(x=>x.post_id===p.id),comments:(cr.data||[]).filter(x=>x.post_id===p.id),am:cm,author:pm.get(p.author_id),shared:true,sharedAt:s.created_at,sortAt:s.created_at} )});
    items.sort((a,b)=>new Date(b.sortAt)-new Date(a.sortAt));
    return items;
  }

  function renderPosts(items){
    if(!items.length)return'<div class="empty">لا توجد منشورات بعد.</div>';
    return items.map(({p,likes,comments,am,author,shared,sharedAt})=>{
      const liked=likes.some(x=>x.user_id===me.id);
      return `<article class="card post profile-post" data-post="${p.id}">
        ${shared?`<div class="shared-post-label">↗️ منشور مُشارك في الملف الشخصي · ${fmt(sharedAt)}</div>`:''}
        <div class="post-head profile-post-head"><div class="avatar">${author?.avatar_url?`<img src="${esc(author.avatar_url)}" alt="">`:ini(author?.display_name)}</div><div><b>${esc(author?.display_name||'مستخدم Mada')}</b><div class="post-time">${fmt(p.created_at)}</div></div></div>
        <div class="post-text">${esc(p.body||'')}</div>${p.media_url?`<img class="post-image" src="${esc(p.media_url)}" alt="صورة المنشور" loading="lazy">`:''}
        <div class="post-actions"><button class="profile-like ${liked?'liked':''}" data-id="${p.id}" data-liked="${liked}">👍 إعجاب ${likes.length}</button><button class="profile-comment" data-id="${p.id}">💬 تعليق ${comments.length}</button><button class="profile-share" data-id="${p.id}">↗️ مشاركة</button></div>
        <div class="profile-comments">${comments.map(c=>`<div class="comment"><b>${esc(am.get(c.author_id)?.display_name||'مستخدم')}</b> ${esc(c.body)}</div>`).join('')}<div class="comment-box"><input data-pcomment="${p.id}" placeholder="اكتب تعليقًا..."><button data-psend="${p.id}">إرسال</button></div></div>
      </article>`;
    }).join('');
  }

  async function toggleLike(id,liked,profileId){const q=liked?sb.from('post_likes').delete().eq('post_id',id).eq('user_id',me.id):sb.from('post_likes').insert({post_id:id,user_id:me.id});const{error}=await q;if(error)return alert('تعذر حفظ الإعجاب: '+error.message);cache.delete('counts:'+profileId);open(profileId)}
  async function comment(id,profileId){const b=document.querySelector(`[data-pcomment="${id}"]`),body=b?.value.trim();if(!body)return;const{error}=await sb.from('comments').insert({post_id:id,author_id:me.id,body});if(error)return alert('تعذر إضافة التعليق: '+error.message);open(profileId)}

  async function share(id){
    const currentProfile=window.__MADA_PROFILE_ID||me.id;
    const existing=await sb.from('post_shares').select('id').eq('post_id',id).eq('user_id',me.id).eq('target_user_id',me.id).maybeSingle();
    if(existing.data){return alert('المنشور موجود بالفعل في ملفك الشخصي ✓')}
    const{error}=await sb.from('post_shares').insert({post_id:id,user_id:me.id,target_user_id:me.id});
    if(error)return alert('تعذر مشاركة المنشور: '+error.message);
    cache.delete('counts:'+me.id);
    alert('تمت مشاركة المنشور في ملفك الشخصي ✓');
    if(currentProfile===me.id)open(me.id);
  }

  async function sendFriendRequest(id){
    if(!id||id===me.id)return;
    const current=await relation(id);
    if(current.fr?.status==='accepted')return alert('أنتما أصدقاء بالفعل.');
    if(current.fr?.status==='pending'){
      if(current.fr.requester_id===me.id)return alert('تم إرسال طلب الصداقة بالفعل.');
      const{error}=await sb.from('friendships').update({status:'accepted',updated_at:new Date().toISOString()}).eq('id',current.fr.id);
      if(error)return alert('تعذر قبول طلب الصداقة: '+error.message);
      cache.delete('counts:'+id); cache.delete('counts:'+me.id); open(id); return;
    }
    const{error}=await sb.from('friendships').insert({requester_id:me.id,addressee_id:id,status:'pending'}).select('id').single();
    if(error){
      const retry=await relation(id);
      if(retry.fr?.status==='pending')return open(id);
      return alert('تعذر إرسال طلب الصداقة: '+error.message);
    }
    cache.delete('counts:'+id); cache.delete('counts:'+me.id); open(id);
  }

  async function open(id=me.id){
    if(!me){const s=await sb.auth.getUser();me=s.data.user||null}
    if(!me)return;
    const seq=++openSeq;
    const own=id===me.id;
    window.__MADA_PROFILE_ID=id;
    show('👤 الملف الشخصي','<div class="profile-page profile-loading"><div class="profile-loading-avatar"></div><div class="profile-loading-line"></div><div class="profile-loading-line short"></div><div class="empty">جاري فتح الملف الشخصي…</div></div>');
    const [pr,c,r,items]=await Promise.all([
      sb.from('profiles').select('*').eq('id',id).single(),counts(id),relation(id),postData(id)
    ]);
    if(seq!==openSeq)return;
    if(pr.error||!pr.data)return show('👤 الملف الشخصي','<div class="empty">تعذر تحميل الملف الشخصي. حاول مرة أخرى.</div>');
    const p=pr.data; const images=items.filter(x=>x.p.media_url).slice(0,12).map(x=>x.p.media_url);
    let action=own?'<button id="editProfile" class="primary wide">✏️ تعديل الملف</button>':(r.fr?.status==='accepted'?'<button class="profile-pill success">✓ أصدقاء</button>':r.fr?.status==='pending'?(r.fr.requester_id===me.id?'<button class="profile-pill">⏳ طلب مُرسل</button>':'<button id="acceptFriend" class="primary">✓ قبول الصداقة</button>'):'<button id="addFriend" class="primary">👥 إضافة صديق</button>')+`<button id="followBtn" class="profile-pill">${r.follow?'✓ إلغاء المتابعة':'➕ متابعة'}</button><button id="chatProfile" class="profile-pill">💬 رسالة</button>`;
    show('👤 الملف الشخصي',`<div class="profile-page"><div class="cover" style="background-image:url('${esc(p.cover_url||'')}')"></div><div class="profile-main"><div class="profile-avatar">${p.avatar_url?`<img src="${esc(p.avatar_url)}">`:ini(p.display_name)}</div><h2>${esc(p.display_name)} ${p.role==='admin'?'👑':''}</h2><p class="profile-bio">${esc(p.bio||'لا توجد نبذة حتى الآن.')}</p><div class="profile-stats"><div><b>${c.posts}</b><span>منشور</span></div><div><b>${c.friends}</b><span>أصدقاء</span></div><div><b>${c.followers}</b><span>متابعون</span></div></div><div class="profile-actions">${action}</div></div><div class="profile-tabs"><button id="tabPosts" class="active">المنشورات</button><button id="tabPhotos">الصور</button></div><div class="profile-content"><div id="profilePosts" class="profile-posts">${renderPosts(items)}</div><div id="profilePhotos" class="profile-photos" hidden>${images.length?images.map(u=>`<img src="${esc(u)}" alt="صورة" loading="lazy">`).join(''):'<div class="empty">لا توجد صور.</div>'}</div></div></div>`);
    if(seq!==openSeq)return;
    $('tabPosts').onclick=()=>{$('tabPosts').classList.add('active');$('tabPhotos').classList.remove('active');$('profilePosts').hidden=false;$('profilePhotos').hidden=true};
    $('tabPhotos').onclick=()=>{$('tabPhotos').classList.add('active');$('tabPosts').classList.remove('active');$('profilePosts').hidden=true;$('profilePhotos').hidden=false};
    const box=$('modal');box.onclick=async e=>{const like=e.target.closest('.profile-like');if(like)return toggleLike(like.dataset.id,like.dataset.liked==='true',id);const send=e.target.closest('[data-psend]');if(send)return comment(send.dataset.psend,id);const ct=e.target.closest('.profile-comment');if(ct)return document.querySelector(`[data-pcomment="${ct.dataset.id}"]`)?.focus();const sh=e.target.closest('.profile-share');if(sh)return share(sh.dataset.id)};
    if(own){$('editProfile').onclick=edit}else{
      $('addFriend')?.addEventListener('click',()=>sendFriendRequest(id));
      $('acceptFriend')?.addEventListener('click',()=>sendFriendRequest(id));
      $('followBtn')?.addEventListener('click',async()=>{if(r.follow)await sb.from('follows').delete().eq('follower_id',me.id).eq('following_id',id);else await sb.from('follows').insert({follower_id:me.id,following_id:id});open(id)});
      $('chatProfile')?.addEventListener('click',()=>window.openChat?.(id));
    }
  }

  async function edit(){const{data:p}=await sb.from('profiles').select('*').eq('id',me.id).single();show('✏️ تعديل الملف',`<div class="edit-profile"><div class="upload-card"><div id="avatarPreview" class="upload-preview avatar-preview">${p.avatar_url?`<img src="${esc(p.avatar_url)}">`:'👤'}</div><div><b>الصورة الشخصية</b><small>اختر صورة من الهاتف وسيتم ضغطها تلقائيًا.</small><input id="avatarFile" type="file" accept="image/*" hidden><button id="pickAvatar" class="profile-pill">📷 تغيير الصورة</button></div></div><div class="upload-card"><div id="coverPreview" class="upload-preview cover-preview">${p.cover_url?`<img src="${esc(p.cover_url)}">`:'🖼️'}</div><div><b>صورة الغلاف</b><small>سيتم تصغير الصورة وتحسين حجمها قبل الرفع.</small><input id="coverFile" type="file" accept="image/*" hidden><button id="pickCover" class="profile-pill">🖼️ تغيير الغلاف</button></div></div><label>الاسم<input id="epName" value="${esc(p.display_name)}"></label><label>اسم المستخدم<input id="epUser" value="${esc(p.username||'')}"></label><label>النبذة<textarea id="epBio">${esc(p.bio||'')}</textarea></label><button id="saveProfile" class="primary wide">💾 حفظ التعديلات</button><div id="uploadStatus" class="upload-status"></div></div>`);let avatarUrl=p.avatar_url,coverUrl=p.cover_url;$('pickAvatar').onclick=()=>$('avatarFile').click();$('pickCover').onclick=()=>$('coverFile').click();$('avatarFile').onchange=async()=>{const f=$('avatarFile').files?.[0];if(!f)return;try{$('uploadStatus').textContent='جاري ضغط ورفع الصورة الشخصية…';avatarUrl=await uploadProfileImage(f,'avatar');$('avatarPreview').innerHTML=`<img src="${esc(avatarUrl)}">`;$('uploadStatus').textContent='✅ تم رفع الصورة الشخصية'}catch(e){$('uploadStatus').textContent='❌ تعذر رفع الصورة: '+e.message}};$('coverFile').onchange=async()=>{const f=$('coverFile').files?.[0];if(!f)return;try{$('uploadStatus').textContent='جاري ضغط ورفع صورة الغلاف…';coverUrl=await uploadProfileImage(f,'cover');$('coverPreview').innerHTML=`<img src="${esc(coverUrl)}">`;$('uploadStatus').textContent='✅ تم رفع صورة الغلاف'}catch(e){$('uploadStatus').textContent='❌ تعذر رفع الصورة: '+e.message}};$('saveProfile').onclick=async()=>{const{error}=await sb.from('profiles').update({display_name:$('epName').value.trim(),username:$('epUser').value.trim()||null,bio:$('epBio').value.trim(),avatar_url:avatarUrl||null,cover_url:coverUrl||null,updated_at:new Date().toISOString()}).eq('id',me.id);if(error)alert('تعذر الحفظ: '+error.message);else{cache.clear();open(me.id)}}}
  async function init(){const{data:{session}}=await sb.auth.getSession();if(session)me=session.user;}
  return{init,open};
})();window.ProfileUI=ProfileUI;