// Mada Reel comments + Story views overlay
(function(){
  const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  const me=()=>window.madaUser?.()||window.user;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const $=id=>document.getElementById(id);
  function modal(t,h){window.showModal?.(t,h)}

  async function reelComments(postId){
    const s=sb(); if(!s)return;
    modal('💬 تعليقات الريلز','<div class="rr-comments"><div id="rrList" class="rr-list">جاري تحميل التعليقات…</div><div class="rr-compose"><input id="rrInput" maxlength="1000" placeholder="اكتب تعليقًا…"><button id="rrSend" class="primary">إرسال</button></div></div>');
    const load=async()=>{
      const r=await s.from('comments').select('id,author_id,body,created_at').eq('post_id',postId).order('created_at',{ascending:true});
      const rows=r.data||[], ids=[...new Set(rows.map(x=>x.author_id).filter(Boolean))];
      const pr=ids.length?await s.from('profiles').select('id,display_name,avatar_url').in('id',ids):{data:[]};
      const pm=new Map((pr.data||[]).map(x=>[x.id,x]));
      const box=$('rrList'); if(!box)return;
      box.innerHTML=rows.length?rows.map(c=>{const p=pm.get(c.author_id)||{};return `<div class="rr-comment"><div class="rr-avatar">${p.avatar_url?`<img src="${esc(p.avatar_url)}">`:esc((p.display_name||'م').trim().charAt(0))}</div><div><b>${esc(p.display_name||'مستخدم Mada')}</b><p>${esc(c.body)}</p><small>${new Date(c.created_at).toLocaleString('ar-EG')}</small></div></div>`}).join(''):'<div class="empty">لا توجد تعليقات بعد. كن أول من يعلق.</div>';
      box.scrollTop=box.scrollHeight;
    };
    $('rrSend').onclick=async()=>{const u=me(),input=$('rrInput'),body=input?.value.trim();if(!u||!body)return;if(body.length>1000)return;const b=$('rrSend');b.disabled=true;const r=await s.from('comments').insert({post_id:postId,author_id:u.id,body});b.disabled=false;if(r.error){alert('تعذر إضافة التعليق: '+r.error.message);return}input.value='';await load();updateReelCommentCount(postId)};
    $('rrInput').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('rrSend')?.click()}};
    await load();
  }

  async function updateReelCommentCount(postId){
    const r=await sb().from('comments').select('id',{count:'exact',head:true}).eq('post_id',postId);
    const b=document.querySelector(`[data-reel-comment="${postId}"] b`);if(b)b.textContent=`${r.count||0}`;
  }

  async function recordStoryView(storyId){
    const s=sb(),u=me();if(!s||!u||!storyId)return;
    await s.from('story_views').upsert({story_id:storyId,viewer_id:u.id,viewed_at:new Date().toISOString()},{onConflict:'story_id,viewer_id'});
  }

  async function storyStats(storyId){
    const s=sb(),u=me();if(!s||!u)return;
    const post=await s.from('posts').select('author_id').eq('id',storyId).maybeSingle();
    if(post.data?.author_id!==u.id)return;
    const r=await s.from('story_views').select('viewer_id,viewed_at').eq('story_id',storyId).order('viewed_at',{ascending:false});
    const rows=r.data||[],ids=[...new Set(rows.map(x=>x.viewer_id))];
    const pr=ids.length?await s.from('profiles').select('id,display_name,avatar_url').in('id',ids):{data:[]};
    const pm=new Map((pr.data||[]).map(x=>[x.id,x]));
    const html=`<div class="sv-panel"><div class="sv-total">👁️ <b>${rows.length}</b> مشاهدة</div>${rows.length?rows.map(x=>{const p=pm.get(x.viewer_id)||{};return `<div class="sv-row"><div class="sv-avatar">${p.avatar_url?`<img src="${esc(p.avatar_url)}">`:esc((p.display_name||'م').trim().charAt(0))}</div><div><b>${esc(p.display_name||'مستخدم Mada')}</b><small>${new Date(x.viewed_at).toLocaleString('ar-EG')}</small></div></div>`}).join(''):'<div class="empty">لم يشاهد أحد هذه القصة بعد.</div>'}</div>`;
    modal('👁️ مشاهدات القصة',html);
  }

  function injectCSS(){if($('madaRRStyle'))return;const s=document.createElement('style');s.id='madaRRStyle';s.textContent=`.rr-comments{display:grid;gap:12px}.rr-list{max-height:55vh;overflow:auto;display:grid;gap:10px}.rr-comment{display:flex;gap:9px;padding:9px;border-radius:14px;background:var(--card,#f5f5f5)}.dark .rr-comment{background:#191919}.rr-avatar,.sv-avatar{width:38px;height:38px;min-width:38px;border-radius:50%;overflow:hidden;display:grid;place-items:center;font-weight:800;background:#ddd}.rr-avatar img,.sv-avatar img{width:100%;height:100%;object-fit:cover}.rr-comment p{margin:3px 0}.rr-comment small,.sv-row small{opacity:.65;font-size:11px}.rr-compose{display:flex;gap:8px}.rr-compose input{flex:1;padding:11px 13px;border:1px solid #ddd;border-radius:13px;background:transparent;color:inherit}.sv-panel{display:grid;gap:10px}.sv-total{font-size:18px;padding:10px 0}.sv-row{display:flex;gap:10px;align-items:center;padding:9px;border-radius:13px;background:var(--card,#f5f5f5)}.dark .sv-row{background:#191919}.sv-row div:last-child{display:grid;gap:2px}`;document.head.appendChild(s)}

  function bind(){
    injectCSS();
    document.addEventListener('click',e=>{
      const c=e.target.closest('[data-reel-comment]');
      if(c){e.preventDefault();e.stopImmediatePropagation();reelComments(c.dataset.reelComment);return}
      const story=e.target.closest('[data-story-id]');
      if(story){setTimeout(()=>recordStoryView(story.dataset.storyId),500)}
      const media=e.target.closest('#msMedia');
      if(media){const storyId=window.__madaCurrentStoryId;if(storyId)recordStoryView(storyId)}
      const viewBtn=e.target.closest('#msViews');
      if(viewBtn){e.preventDefault();storyStats(viewBtn.dataset.storyId)}
    },true);

    const old=window.MadaStoriesReels;
    if(old&&!old.__viewsWrapped){
      const original=old.viewStory;
      if(original)old.viewStory=async function(id){window.__madaCurrentStoryId=id;await original(id);await recordStoryView(id);setTimeout(async()=>{const u=me(),s=sb();if(!u||!s)return;const p=await s.from('posts').select('author_id').eq('id',id).maybeSingle();if(p.data?.author_id!==u.id)return;const r=await s.from('story_views').select('id',{count:'exact',head:true}).eq('story_id',id);const head=document.querySelector('.mada-story-v3 .ms-head');if(head&&!document.getElementById('msViews')){const b=document.createElement('button');b.id='msViews';b.className='ms-delete';b.dataset.storyId=id;b.textContent=`👁️ ${r.count||0}`;head.appendChild(b)}},250)};
      old.__viewsWrapped=true;
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,250));else setTimeout(bind,250);
  let tries=0;const timer=setInterval(()=>{if(window.MadaStoriesReels&&!window.MadaStoriesReels.__viewsWrapped){bind();tries++}if(tries>20)clearInterval(timer)},500);
})();