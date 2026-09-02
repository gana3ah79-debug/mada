(function(){
  const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const isVideo=u=>/\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(String(u||''));
  const currentUser=async()=>{try{return (await sb().auth.getUser()).data.user||null}catch{return null}};

  async function shareDialog(id){
    const s=sb(); if(!s||!id)return;
    showModal('↗️ مشاركة المنشور',`<div class="share-upgrade"><p>اختر طريقة مشاركة المنشور:</p><button id="shareProfile" class="primary wide">👤 مشاركة داخل ملفي</button><button id="shareFriend" class="profile-pill wide">👥 مشاركة مع صديق</button><button id="shareExternal" class="profile-pill wide">🌐 مشاركة خارج Mada</button><button id="copyExternal" class="profile-pill wide">🔗 نسخ الرابط</button><p id="shareMsg" class="muted"></p></div>`);
    const me=await currentUser(); const {data:post}=await s.from('posts').select('id,author_id,body,media_url').eq('id',id).maybeSingle();
    if(!post){$('shareMsg').textContent='المنشور غير موجود.';return}
    const url=location.origin+location.pathname+'#post-'+id;
    $('shareProfile').onclick=async()=>{if(!me){$('shareMsg').textContent='سجل الدخول أولاً للمشاركة داخل ملفك.';return}const r=await s.from('posts').insert({author_id:me.id,body:`🔁 مشاركة من منشور Mada\n${post.body||''}`.trim(),media_url:post.media_url||null,visibility:'public'});$('shareMsg').textContent=r.error?'❌ '+r.error.message:'✅ تمت المشاركة داخل ملفك.'};
    $('shareFriend').onclick=async()=>{if(!me){$('shareMsg').textContent='سجل الدخول أولاً.';return}const fr=await s.from('friendships').select('requester_id,addressee_id').or(`requester_id.eq.${me.id},addressee_id.eq.${me.id}`).eq('status','accepted');const ids=(fr.data||[]).map(x=>x.requester_id===me.id?x.addressee_id:x.requester_id);if(!ids.length){$('shareMsg').textContent='لا توجد أصدقاء بعد.';return}const ps=(await s.from('profiles').select('id,display_name').in('id',ids).limit(30)).data||[];$('shareMsg').innerHTML=ps.map(p=>`<button class="social-btn" data-up-share="${p.id}">${esc(p.display_name||'صديق')}</button>`).join(' ');document.querySelectorAll('[data-up-share]').forEach(x=>x.onclick=async()=>{const r=await s.from('post_shares').insert({post_id:id,user_id:me.id,target_user_id:x.dataset.upShare});x.textContent=r.error?'فشل':'✓ تمت';x.disabled=true})};
    $('shareExternal').onclick=async()=>{try{if(navigator.share)await navigator.share({title:'Mada',text:'منشور على Mada',url});else await navigator.clipboard.writeText(url);$('shareMsg').textContent='✅ تمت المشاركة خارج Mada.'}catch{}};
    $('copyExternal').onclick=async()=>{try{await navigator.clipboard.writeText(url);$('shareMsg').textContent='✅ تم نسخ الرابط.'}catch{$('shareMsg').textContent=url}};
  }

  function protectShare(){document.addEventListener('click',e=>{const b=e.target.closest('.share,.profile-share');if(!b)return;e.preventDefault();e.stopImmediatePropagation();shareDialog(b.dataset.id)},true)}

  function makeVideos(){document.querySelectorAll('#feed .post-image,.profile-post .post-image').forEach(el=>{if(el.dataset.videoDone||!isVideo(el.src))return;const v=document.createElement('video');v.className=el.className;v.controls=true;v.playsInline=true;v.preload='metadata';v.src=el.src;el.replaceWith(v);v.dataset.videoDone='1'})}
  function addVideoComposer(){const input=$('imageInput');if(input)input.accept='image/*,video/*';const btn=$('videoBtn');if(btn&&!btn.dataset.videoBound){btn.dataset.videoBound='1';btn.onclick=()=>input?.click()}}

  async function loadPublicStories(){
    const row=$('storyRow');if(!row)return;
    const r=await sb().from('posts').select('id,author_id,media_url,created_at,body').eq('visibility','story').gt('created_at',new Date(Date.now()-86400000).toISOString()).order('created_at',{ascending:false}).limit(30);
    const items=r.data||[];const ids=[...new Set(items.map(x=>x.author_id).filter(Boolean))];const p=ids.length?await sb().from('profiles').select('id,display_name,avatar_url').in('id',ids):{data:[]};const pm=new Map((p.data||[]).map(x=>[x.id,x]));
    row.innerHTML=`<button id="addStoryBtn" class="story-card add-story" type="button"><div class="story-avatar plus">+</div><b>إنشاء قصة</b></button>`+items.map(x=>{const a=pm.get(x.author_id)||{},img=a.avatar_url||x.media_url;return `<button class="story-card" data-story-id="${x.id}" type="button"><div class="story-avatar">${img?`<img src="${esc(img)}">`:'م'}</div><b>${esc(a.display_name||'مستخدم')}</b></button>`}).join('');
    $('addStoryBtn').onclick=async()=>{if(!await currentUser()){showModal('تسجيل الدخول','سجل الدخول لإنشاء قصة.');return}window.MadaStoriesReels?.create('story')};
    row.querySelectorAll('[data-story-id]').forEach(b=>b.onclick=()=>viewStory(b.dataset.storyId));
  }
  async function viewStory(id){const {data:r}=await sb().from('posts').select('id,author_id,media_url,body,created_at').eq('id',id).maybeSingle();if(!r)return;const{data:p}=await sb().from('profiles').select('display_name').eq('id',r.author_id).maybeSingle();const u=r.media_url||'';const v=isVideo(u);showModal('قصة '+esc(p?.display_name||'مستخدم'),`<div class="story-view">${v?`<video controls autoplay playsinline src="${esc(u)}"></video>`:`<img src="${esc(u)}">`}<p>${esc(r.body||'')}</p></div>`) }

  async function loadReels(){const r=await sb().from('posts').select('id,author_id,media_url,body,created_at').eq('visibility','reel').order('created_at',{ascending:false}).limit(30);const items=r.data||[];const ids=[...new Set(items.map(x=>x.author_id).filter(Boolean))];const p=ids.length?await sb().from('profiles').select('id,display_name').in('id',ids):{data:[]};const pm=new Map((p.data||[]).map(x=>[x.id,x]));showModal('🎬 الريلز',`<div class="reels-list">${items.length?items.map(x=>`<article class="reel-item"><video controls playsinline preload="metadata" src="${esc(x.media_url)}"></video><div class="reel-caption"><b>${esc(pm.get(x.author_id)?.display_name||'مستخدم')}</b><div>${esc(x.body||'')}</div></div></article>`).join(''):'<div class="empty">لا توجد ريلز بعد.</div>'}</div>`)}

  async function premiumBadge(id){const s=sb();if(!s||!id)return false;const r=await s.rpc('has_premium',{p_user_id:id});return !r.error&&!!r.data}
  async function markPremium(){
    const nodes=[...document.querySelectorAll('.post-name.profile-link,[data-profile-name]')];
    for(const n of nodes){const id=n.dataset.profile||n.dataset.userId;if(id&&await premiumBadge(id)&&!n.querySelector('.premium-crown'))n.insertAdjacentHTML('beforeend',' <span class="premium-crown" title="عضوية Premium">👑</span>')}
    const page=document.querySelector('.profile-page');const h=page?.querySelector('.profile-main h2');if(h&&!h.querySelector('.premium-crown')){const id=window.ProfileUI?.getCurrentId?.();if(id&&await premiumBadge(id))h.insertAdjacentHTML('beforeend',' <span class="premium-crown" title="عضوية Premium">👑</span>')}
  }

  function profileDeleteButtons(){const page=document.querySelector('.profile-page');if(!page)return;const edit=page.querySelector('#editProfile');if(!edit)return;page.querySelectorAll('.profile-post').forEach(article=>{if(article.querySelector('.profile-delete'))return;const b=document.createElement('button');b.className='profile-delete';b.type='button';b.textContent='🗑️ حذف';b.dataset.id=article.dataset.post;article.querySelector('.post-actions')?.appendChild(b)})}
  async function deleteProfilePost(id,article){const s=sb(),me=await currentUser();if(!me)return showModal('تسجيل الدخول','سجل الدخول لحذف المنشور.');const{data:p}=await s.from('posts').select('author_id').eq('id',id).maybeSingle();if(p?.author_id!==me.id)return alert('لا يمكنك حذف هذا المنشور.');if(!confirm('حذف المنشور نهائيًا؟'))return;await s.from('comments').delete().eq('post_id',id);await s.from('post_likes').delete().eq('post_id',id);await s.from('post_shares').delete().eq('post_id',id);const r=await s.from('posts').delete().eq('id',id).eq('author_id',me.id);if(r.error)return alert('تعذر الحذف: '+r.error.message);article?.remove()}

  function boot(){
    protectShare();
    addVideoComposer();
    setTimeout(()=>{loadPublicStories();makeVideos();profileDeleteButtons();markPremium()},500);
    document.addEventListener('click',e=>{const b=e.target.closest('.profile-delete');if(b){e.preventDefault();e.stopPropagation();deleteProfilePost(b.dataset.id,b.closest('.profile-post'))}},true);
    const feed=$('feed');if(feed){const obs=new MutationObserver(()=>{clearTimeout(window.__madaSocialTimer);window.__madaSocialTimer=setTimeout(()=>{makeVideos();profileDeleteButtons();markPremium()},350)});obs.observe(feed,{childList:true,subtree:true})}
    $('reelsBtn')?.addEventListener('click',loadReels);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.MadaSocialUpgrades={shareDialog,loadPublicStories,loadReels,viewStory,markPremium};
})();