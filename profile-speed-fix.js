/* Mada profile speed fix: lightweight profile rendering to avoid 30-post + comments freeze. */
(function(){
  const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const ini=n=>(n||'م').trim().charAt(0);
  const modal=(t,b)=>window.showModal?.(t,b);
  let original=null;
  async function openFast(id){
    const s=sb(), me=window.user;
    if(!s||!me||!id)return;
    const own=id===me.id;
    modal('👤 الملف الشخصي','<div class="profile-page profile-loading"><div class="profile-loading-avatar"></div><div class="profile-loading-line"></div><div class="profile-loading-line short"></div><div class="empty">جاري فتح الملف الشخصي…</div></div>');
    const pr=await s.from('profiles').select('id,display_name,username,bio,avatar_url,cover_url,role').eq('id',id).maybeSingle();
    if(pr.error||!pr.data){modal('👤 الملف الشخصي','<div class="empty">تعذر تحميل الملف الشخصي.</div>');return;}
    const p=pr.data;
    modal('👤 الملف الشخصي',`<div class="profile-page"><div class="cover" style="background-image:url('${esc(p.cover_url||'')}')"></div><div class="profile-main"><div class="profile-avatar">${p.avatar_url?`<img src="${esc(p.avatar_url)}" loading="lazy">`:ini(p.display_name)}</div><h2>${esc(p.display_name||'مستخدم')} ${p.role==='admin'?'👑':''}</h2><p class="profile-bio">${esc(p.bio||'لا توجد نبذة حتى الآن.')}</p><div class="profile-stats"><div class="profile-stat"><b id="psPosts">…</b><span>منشور</span></div><div class="profile-stat"><b id="psFriends">…</b><span>أصدقاء</span></div><div class="profile-stat"><b id="psFollowers">…</b><span>متابعون</span></div></div><div class="profile-actions" id="psActions"></div></div><div class="profile-tabs"><button class="active">المنشورات</button></div><div id="psPostsList" class="profile-posts"><div class="empty">جاري تحميل المنشورات…</div></div></div>`);
    window.__MADA_PROFILE_ID=id;
    // Load the remaining data in parallel and cap the expensive post payload.
    const [fr,fo,pc,posts]=await Promise.all([
      s.from('friendships').select('requester_id,addressee_id').or(`and(requester_id.eq.${id},status.eq.accepted),and(addressee_id.eq.${id},status.eq.accepted)`),
      s.from('follows').select('follower_id').eq('following_id',id),
      s.from('posts').select('id,body,media_url,created_at').eq('author_id',id).order('created_at',{ascending:false}).limit(10),
      own?Promise.resolve({data:[] }):s.from('friendships').select('id,requester_id,addressee_id,status').or(`and(requester_id.eq.${me.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${me.id})`).maybeSingle()
    ]);
    const friendCount=(fr.data||[]).length, followerCount=(fo.data||[]).length;
    const postRows=posts.data||[];
    $('psPosts').textContent=postRows.length+(postRows.length===10?'+':'');
    $('psFriends').textContent=friendCount;
    $('psFollowers').textContent=followerCount;
    const rel=posts===null?null:null;
    const r=own?{status:'self'}:(posts && posts.data ? posts : null);
    const actions=$('psActions');
    if(own) actions.innerHTML='<button id="psEdit" class="primary wide">✏️ تعديل الملف</button>';
    else actions.innerHTML='<button id="psFriend" class="primary">👥 إضافة صديق</button><button id="psFollow" class="profile-pill">➕ متابعة</button><button id="psChat" class="profile-pill">💬 رسالة</button>';
    if(own)$('psEdit').onclick=()=>original?.call(window,id);
    if(!own){
      const rr=posts && posts.data ? null : null;
      let relation=null;
      if(posts && posts.data!==undefined) relation=posts;
      // Fetch relation separately only for non-owner; this is one small request.
      const q=await s.from('friendships').select('id,requester_id,addressee_id,status').or(`and(requester_id.eq.${me.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${me.id})`).maybeSingle();
      relation=q.data;
      const fb=$('psFriend'); if(relation?.status==='accepted')fb.textContent='✓ أصدقاء'; else if(relation?.status==='pending')fb.textContent=relation.requester_id===me.id?'⏳ طلب مُرسل':'✓ قبول الصداقة';
      fb.onclick=async()=>{if(relation?.status==='accepted')return; if(relation?.status==='pending'&&relation.requester_id!==me.id){const x=await s.from('friendships').update({status:'accepted',updated_at:new Date().toISOString()}).eq('id',relation.id);if(!x.error){fb.textContent='✓ أصدقاء';relation.status='accepted'}} else if(!relation){const x=await s.from('friendships').insert({requester_id:me.id,addressee_id:id,status:'pending'});if(!x.error){fb.textContent='⏳ طلب مُرسل';relation=x.data?.[0]||{status:'pending',requester_id:me.id}}}};
      const follow=s.from('follows').select('follower_id').eq('follower_id',me.id).eq('following_id',id).maybeSingle();
      const fq=await follow; let isFollow=!!fq.data; $('psFollow').textContent=isFollow?'✓ إلغاء المتابعة':'➕ متابعة'; $('psFollow').onclick=async()=>{const x=isFollow?await s.from('follows').delete().eq('follower_id',me.id).eq('following_id',id):await s.from('follows').insert({follower_id:me.id,following_id:id});if(!x.error){isFollow=!isFollow;$('psFollow').textContent=isFollow?'✓ إلغاء المتابعة':'➕ متابعة'}};
      $('psChat').onclick=()=>window.openChat?.(id);
    }
    const list=$('psPostsList');
    if(!postRows.length){list.innerHTML='<div class="empty">لا توجد منشورات حتى الآن.</div>';return;}
    list.innerHTML=postRows.map(x=>`<article class="card profile-post"><div class="post-text">${esc(x.body||'')}</div>${x.media_url?`<img class="post-image" src="${esc(x.media_url)}" loading="lazy" alt="صورة المنشور">`:''}<div class="post-time">${new Date(x.created_at).toLocaleString('ar-EG')}</div></article>`).join('');
  }
  function install(){if(!window.ProfileUI?.open||window.ProfileUI.open.__madaSpeed)return;original=window.ProfileUI.open;const fast=function(id){return openFast(id)};fast.__madaSpeed=true;window.ProfileUI.open=fast;window.MadaProfileSpeed={original,open:fast};}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else install();
})();
