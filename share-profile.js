(function(){
 const {createClient}=window.supabase; const sb=createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
 let targetPostId=null,targetPost=null,shareVisibility='public';
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
 function ensureModal(){
  if($('share-modal'))return;
  document.body.insertAdjacentHTML('beforeend',`<div id="share-modal" class="share-sheet" hidden><div class="share-sheet-backdrop" data-close-share></div><section class="share-sheet-content" role="dialog" aria-modal="true" aria-labelledby="share-title"><div class="share-sheet-handle"></div><header class="share-sheet-header"><button class="share-close" type="button" data-close-share>✕</button><div><b id="share-title">مشاركة المنشور</b><small>اختر من يمكنه رؤية المشاركة على ملفك الشخصي</small></div></header><div class="share-user-row"><div id="share-user-avatar" class="share-avatar">م</div><div class="share-user-meta"><strong id="share-user-name">مستخدم Mada</strong><div class="share-privacy"><button type="button" id="share-privacy-btn" class="privacy-chip">الموجز 🌐 ▾</button><div id="share-privacy-menu" class="privacy-menu" hidden><button type="button" data-privacy="public"><b>🌐 الموجز</b><small>تظهر المشاركة في الموجز العام وعلى ملفك</small></button><button type="button" data-privacy="private"><b>🔒 أنا فقط</b><small>تظهر لك فقط على ملفك الشخصي</small></button></div></div></div></div><textarea id="share-quote" maxlength="5000" placeholder="اكتب شيئًا..." rows="3"></textarea><div id="original-post-preview" class="original-share-preview"></div><div class="share-sheet-actions"><div class="share-extra"><button type="button">👤+</button><button type="button">😊</button></div><button id="execute-profile-share" type="button" class="share-now">مشاركة الآن</button></div></section></div>`);
  document.querySelectorAll('[data-close-share]').forEach(b=>b.onclick=closeShareModal);
  $('execute-profile-share').onclick=executeProfileShare;
  $('share-privacy-btn').onclick=()=>{$('share-privacy-menu').hidden=!$('share-privacy-menu').hidden};
  $('share-privacy-menu').onclick=e=>{const b=e.target.closest('[data-privacy]');if(!b)return;shareVisibility=b.dataset.privacy;$('share-privacy-btn').textContent=shareVisibility==='private'?'أنا فقط 🔒 ▾':'الموجز 🌐 ▾';$('share-privacy-menu').hidden=true;};
 }
 async function openShareModal(id){
  ensureModal();targetPostId=id;shareVisibility='public';
  const {data:{user}}=await sb.auth.getUser();if(!user)return alert('يرجى تسجيل الدخول');
  const [{data:p,error},{data:me}]=await Promise.all([
   sb.from('posts').select('id,author_id,body,media_url,created_at,visibility,profiles!posts_author_id_fkey(display_name,avatar_url)').eq('id',id).maybeSingle(),
   sb.from('profiles').select('display_name,avatar_url').eq('id',user.id).maybeSingle()
  ]);
  if(error||!p)return alert('تعذر تحميل المنشور للمشاركة.');
  targetPost=p;const original=p.profiles||{};const currentName=me?.display_name||user.email?.split('@')[0]||'مستخدم Mada';$('share-user-name').textContent=currentName;$('share-user-avatar').textContent=currentName.trim().charAt(0);$('share-privacy-btn').textContent='الموجز 🌐 ▾';$('share-quote').value='';$('original-post-preview').innerHTML=`<div class="original-label">المنشور الأصلي</div><div class="original-author">${esc(original.display_name||'مستخدم Mada')}</div><div class="original-text">${esc(p.body||'منشور بصورة')}</div>${p.media_url?`<img src="${esc(p.media_url)}" alt="المنشور الأصلي">`:''}`;$('share-modal').hidden=false;setTimeout(()=>$('share-quote')?.focus(),100);
 }
 function closeShareModal(){if($('share-modal'))$('share-modal').hidden=true;targetPostId=null;targetPost=null;shareVisibility='public';}
 async function executeProfileShare(){
  if(!targetPostId)return;
  const {data:{user}}=await sb.auth.getUser();if(!user)return alert('يرجى تسجيل الدخول');
  const btn=$('execute-profile-share');btn.disabled=true;btn.textContent='جارٍ النشر…';
  try{
   const quote=$('share-quote').value.trim();
   const body=quote||'🔁 تمت مشاركة منشور';
   const {error}=await sb.from('posts').insert({author_id:user.id,body,visibility:shareVisibility,shared_post_id:targetPostId});
   if(error)throw error;
   // post_shares is optional analytics; never let a missing/failed table break a successful share.
   try{await sb.from('post_shares').insert({post_id:targetPostId,user_id:user.id});}catch(_e){console.warn('post_shares insert skipped',_e);}
   const message=shareVisibility==='private'?'تمت المشاركة وحفظها في ملفك — أنت فقط تستطيع رؤيتها.':'تمت مشاركة المنشور في ملفك الشخصي وظهرت في الموجز.';
   closeShareModal();alert(message);
   if(location.pathname.endsWith('index.html')||location.pathname.endsWith('/')){const feed=document.getElementById('feed');if(feed&&typeof window.loadFeed==='function')window.loadFeed();else location.reload();}
  }catch(e){alert('حدث خطأ أثناء المشاركة: '+(e.message||e));}
  finally{if($('execute-profile-share')){btn.disabled=false;btn.textContent='مشاركة الآن';}}
 }
 function goToMyProfile(){sb.auth.getUser().then(({data})=>{if(data?.user)location.href=`profile.html?id=${encodeURIComponent(data.user.id)}`;});}
 document.addEventListener('click',e=>{const share=e.target.closest('.share');if(share){e.preventDefault();e.stopImmediatePropagation();openShareModal(share.dataset.id);return;}if(e.target.closest('#profileNav')){e.preventDefault();e.stopImmediatePropagation();goToMyProfile();return;}if($('share-privacy-menu')&&!e.target.closest('.share-privacy'))$('share-privacy-menu').hidden=true;},true);
 window.openShareModal=openShareModal;window.closeShareModal=closeShareModal;window.executeProfileShare=executeProfileShare;window.goToMyProfile=goToMyProfile;
})();