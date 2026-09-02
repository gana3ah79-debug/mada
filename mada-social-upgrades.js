(function(){
  const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const isVideo=u=>/\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(String(u||''));

  function protect(){
    document.addEventListener('click',e=>{
      const b=e.target.closest('.share,.profile-share');
      if(!b)return;
      e.preventDefault();e.stopImmediatePropagation();
      shareDialog(b.dataset.id);
    },true);
  }

  async function shareDialog(id){
    const s=sb();
    if(!s)return;
    showModal('↗️ مشاركة المنشور',`<div class="share-upgrade"><p>اختر طريقة مشاركة المنشور:</p><button id="shareProfile" class="primary wide">👤 مشاركة داخل ملفي</button><button id="shareFriend" class="profile-pill wide">👥 مشاركة مع صديق</button><button id="shareExternal" class="profile-pill wide">🌐 مشاركة خارج Mada</button><button id="copyExternal" class="profile-pill wide">🔗 نسخ الرابط</button><p id="shareMsg" class="muted"></p></div>`);
    const me=(await s.auth.getUser()).data.user;
    const post=(await s.from('posts').select('id,author_id,body,media_url').eq('id',id).maybeSingle()).data;
    if(!post){$('shareMsg').textContent='المنشور غير موجود.';return}
    const url=location.origin+location.pathname+'#post-'+id;
    $('shareProfile').onclick=async()=>{
      if(!me){$('shareMsg').textContent='سجل الدخول أولاً للمشاركة داخل ملفك.';return}
      const r=await s.from('posts').insert({author_id:me.id,body:`🔁 مشاركة من منشور Mada\n${post.body||''}`.trim(),media_url:post.media_url||null,visibility:'public'});
      $('shareMsg').textContent=r.error?'تعذر المشاركة داخل الملف: '+r.error.message:'✅ تمت مشاركة المنشور داخل ملفك.';
      if(!r.error&&window.loadFeed)await window.loadFeed();
    };
    $('shareFriend').onclick=async()=>{if(!me){$('shareMsg').textContent='سجل الدخول أولاً.';return}const fr=await s.from('friendships').select('requester_id,addressee_id').or(`requester_id.eq.${me.id},addressee_id.eq.${me.id}`).eq('status','accepted');const ids=(fr.data||[]).map(x=>x.requester_id===me.id?x.addressee_id:x.requester_id);if(!ids.length){$('shareMsg').textContent='لا توجد قائمة أصدقاء بعد.';return}const ps=(await s.from('profiles').select('id,display_name').in('id',ids).limit(30)).data||[];$('shareMsg').innerHTML=ps.map(p=>`<button class="social-btn" data-up-share="${p.id}">${esc(p.display_name||'صديق')}</button>`).join(' ');document.querySelectorAll('[data-up-share]').forEach(x=>x.onclick=async()=>{const r=await s.from('post_shares').insert({post_id:id,user_id:me.id,target_user_id:x.dataset.upShare});x.textContent=r.error?'فشل':'✓ تمت';x.disabled=true})};
    $('shareExternal').onclick=async()=>{try{if(navigator.share)await navigator.share({title:'Mada',text:'منشور على Mada',url});else await navigator.clipboard.writeText(url);$('shareMsg').textContent='✅ تم فتح المشاركة الخارجية/نسخ الرابط.'}catch{}};
    $('copyExternal').onclick=async()=>{try{await navigator.clipboard.writeText(url);$('shareMsg').textContent='✅ تم نسخ الرابط.'}catch{$('shareMsg').textContent=url}};
  }

  function makeVideos(){
    document.querySelectorAll('#feed .post-image,.profile-post .post-image').forEach(img=>{if(img.dataset.videoDone||!isVideo(img.src))return;const v=document.createElement('video');v.className=img.className;v.controls=true;v.playsInline=true;v.preload='metadata';v.src=img.src;img.replaceWith(v);v.dataset.videoDone='1'});
  }
  function addVideoComposer(){
    const input=$('imageInput');if(input)input.accept='image/*,video/*';
    const btn=[...document.querySelectorAll('.composer-actions button')].find(x=>x.textContent.includes('فيديو'));
    if(btn&&!btn.dataset.videoBound){btn.dataset.videoBound='1';btn.onclick=()=>input?.click()}
  }

  async function premiumBadge(id){
    const s=sb();if(!s||!id)return false;const r=await s.rpc('has_premium',{p_user_id:id});return r.error?false:!!r.data;
  }
  async function markPremium(){
    const names=[...document.querySelectorAll('.post-name.profile-link')];
    const ids=[...new Set(names.map(x=>x.dataset.profile).filter(Boolean))];
    for(const id of ids){if(await premiumBadge(id))names.filter(x=>x.dataset.profile===id).forEach(x=>{if(x.querySelector('.premium-crown'))return;x.insertAdjacentHTML('beforeend',' <span class="premium-crown" title="عضوية Premium">👑</span>')})}
  }

  function profileDeleteButtons(){
    const page=document.querySelector('.profile-page');if(!page)return;
    const own=page.querySelector('#editProfile');if(!own)return;
    page.querySelectorAll('.profile-post').forEach(article=>{if(article.querySelector('.profile-delete'))return;const b=document.createElement('button');b.className='profile-delete';b.type='button';b.textContent='🗑️ حذف';b.dataset.id=article.dataset.post;article.querySelector('.post-actions')?.appendChild(b)});
  }
  async function deleteProfilePost(id,article){
    const s=sb();const me=(await s.auth.getUser()).data.user;if(!me)return;const p=(await s.from('posts').select('author_id').eq('id',id).maybeSingle()).data;if(p?.author_id!==me.id)return alert('لا يمكنك حذف هذا المنشور.');if(!confirm('حذف المنشور نهائيًا؟'))return;await s.from('comments').delete().eq('post_id',id);await s.from('post_likes').delete().eq('post_id',id);await s.from('post_shares').delete().eq('post_id',id);const r=await s.from('posts').delete().eq('id',id).eq('author_id',me.id);if(r.error)return alert('تعذر الحذف: '+r.error.message);article.remove()}

  function watch(){
    const obs=new MutationObserver(()=>{makeVideos();addVideoComposer();profileDeleteButtons();markPremium()});obs.observe(document.body,{childList:true,subtree:true});setTimeout(()=>{makeVideos();addVideoComposer();profileDeleteButtons();markPremium()},400);
    document.addEventListener('click',e=>{const b=e.target.closest('.profile-delete');if(b){e.preventDefault();e.stopPropagation();deleteProfilePost(b.dataset.id,b.closest('.profile-post'))}},true);
  }
  protect();watch();
  window.MadaSocialUpgrades={shareDialog,markPremium};
})();
