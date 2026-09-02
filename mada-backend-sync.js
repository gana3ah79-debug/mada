/* Mada backend sync + feed performance fix. */
(function(){
  const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  let postChannel=null,likeChannel=null,commentChannel=null;
  const article=id=>document.getElementById('post-'+id);
  const currentUser=()=>window.user||null;
  const feed=()=>document.getElementById('feed');
  function setLikeCount(el,count,liked){const btn=el?.querySelector('.post-actions .like');if(!btn)return;btn.dataset.liked=liked?'true':'false';btn.classList.toggle('liked',liked);const old=btn.querySelector('.action-count');if(old)old.textContent=String(count);else btn.innerHTML=`<span class="action-icon">${liked?'💙':'👍'}</span><span>أعجبني</span><b class="action-count">${count}</b>`}
  function ensureMeta(el){let m=el?.querySelector('.post-meta');if(!m){m=document.createElement('div');m.className='post-meta';el.querySelector('.post-actions')?.before(m)}return m}
  function updateMetaLike(el,count){const m=ensureMeta(el),spans=m.querySelectorAll(':scope > span');if(spans[0])spans[0].textContent=`👍 ${count}`}
  function updateMetaComments(el,count){const m=ensureMeta(el);let b=m.querySelector('[data-comments-open]');if(!b){b=document.createElement('button');b.className='meta-link';b.dataset.commentsOpen=el.id.slice(5);m.appendChild(b)}b.textContent=`${count} تعليق`}

  async function toggleLike(btn){
    const s=sb(),u=currentUser(),id=btn?.dataset.id;if(!s||!u||!id||btn.dataset.likeBusy==='1')return;
    const el=article(id),was=btn.dataset.liked==='true';
    const oldCount=Number(btn.querySelector('.action-count')?.textContent||el?.querySelector('.post-meta span')?.textContent?.match(/\d+/)?.[0]||0);
    const next=Math.max(0,oldCount+(was?-1:1));
    btn.dataset.likeBusy='1';setLikeCount(el,next,!was);updateMetaLike(el,next);
    try{const r=was?await s.from('post_likes').delete().eq('post_id',id).eq('user_id',u.id):await s.from('post_likes').insert({post_id:id,user_id:u.id});if(r.error)throw r.error}catch(e){setLikeCount(el,oldCount,was);updateMetaLike(el,oldCount);console.error('Mada like',e)}finally{btn.dataset.likeBusy='0'}
  }

  async function addComment(input){
    const s=sb(),u=currentUser(),id=input?.dataset.comment,body=input?.value.trim();if(!s||!u||!id||!body||input.dataset.commentBusy==='1')return;
    const box=input.closest('.comments'),send=box?.querySelector(`[data-send="${id}"]`);if(send)send.disabled=true;input.dataset.commentBusy='1';
    const temp=document.createElement('div');temp.className='comment';temp.dataset.temp='1';temp.innerHTML=`<b>أنت</b> ${esc(body)}`;box?.insertBefore(temp,box.querySelector('.comment-box'));const old=input.value;input.value='';
    const count=Number(article(id)?.querySelector('.post-meta .meta-link')?.textContent?.match(/\d+/)?.[0]||0)+1;updateMetaComments(article(id),count);
    try{const r=await s.from('comments').insert({post_id:id,author_id:u.id,body});if(r.error)throw r.error;temp.remove()}catch(e){temp.remove();input.value=old;updateMetaComments(article(id),Math.max(0,count-1));console.error('Mada comment',e)}finally{input.dataset.commentBusy='0';if(send)send.disabled=false}
  }

  async function optimizedLoadFeed(){
    const f=feed(),u=currentUser(),s=sb();if(!f||!u||!s)return;
    f.dataset.loading='1';
    const r=await s.from('posts').select('id,author_id,body,media_url,visibility,created_at').eq('visibility','public').order('created_at',{ascending:false}).limit(50);
    if(r.error){f.innerHTML='<div class="card empty">تعذر تحميل المنشورات</div>';f.dataset.loading='0';return}
    const posts=r.data||[];if(!posts.length){f.innerHTML='<div class="card empty">لا توجد منشورات بعد.</div>';f.dataset.loading='0';return}
    const ids=posts.map(p=>p.id),authors=[...new Set(posts.map(p=>p.author_id).filter(Boolean))];
    const [pr,lr,cr,sr]=await Promise.all([
      authors.length?s.from('profiles').select('id,display_name,avatar_url').in('id',authors):Promise.resolve({data:[]}),
      ids.length?s.from('post_likes').select('post_id,user_id').in('post_id',ids):Promise.resolve({data:[]}),
      ids.length?s.from('comments').select('id,post_id,author_id,body,created_at').in('post_id',ids).order('created_at',{ascending:true}).limit(300):Promise.resolve({data:[]}),
      ids.length?s.from('post_shares').select('post_id').in('post_id',ids):Promise.resolve({data:[]})
    ]);
    const pm=new Map((pr.data||[]).map(x=>[x.id,x])),likesBy=new Map(),commentsBy=new Map(),sharesBy=new Map();
    (lr.data||[]).forEach(x=>{if(!likesBy.has(x.post_id))likesBy.set(x.post_id,[]);likesBy.get(x.post_id).push(x)});
    (cr.data||[]).forEach(x=>{if(!commentsBy.has(x.post_id))commentsBy.set(x.post_id,[]);commentsBy.get(x.post_id).push(x)});
    (sr.data||[]).forEach(x=>sharesBy.set(x.post_id,(sharesBy.get(x.post_id)||0)+1));
    const cids=[...new Set((cr.data||[]).map(c=>c.author_id).filter(Boolean))];
    const cp=cids.length?await s.from('profiles').select('id,display_name').in('id',cids):{data:[]};const cm=new Map((cp.data||[]).map(x=>[x.id,x.display_name]));
    f.innerHTML='';
    for(const p of posts){
      const ls=likesBy.get(p.id)||[],cs=commentsBy.get(p.id)||[],a=pm.get(p.author_id)||{},liked=ls.some(x=>x.user_id===u.id),el=document.createElement('article');el.className='card post';el.id='post-'+p.id;
      el.innerHTML=`<div class="post-head"><button class="avatar" data-profile="${p.author_id||''}">${esc((a.display_name||'م').slice(0,1))}</button><div><button class="post-name profile-link" data-profile="${p.author_id||''}">${esc(a.display_name||'مستخدم Mada')}</button><div class="post-time">${new Date(p.created_at).toLocaleString('ar-EG')}</div></div></div><div class="post-text">${esc(p.body||'')}</div>${p.media_url?`<img class="post-image" src="${esc(p.media_url)}" alt="صورة المنشور" loading="lazy">`:''}<div class="post-meta"><span>👍 ${ls.length}</span><button class="meta-link" data-comments-open="${p.id}">${cs.length} تعليق</button><span>${sharesBy.get(p.id)||0} مشاركة</span></div><div class="post-actions"><button class="like ${liked?'liked':''}" data-id="${p.id}" data-liked="${liked}"><span class="action-icon">${liked?'💙':'👍'}</span><span>أعجبني</span><b class="action-count">${ls.length}</b></button><button class="comment-toggle" data-comment-toggle="${p.id}">💬 تعليق</button><button class="share" data-id="${p.id">↗️ مشاركة</button></div><div class="comments" data-comments="${p.id}"><div class="comment-list">${cs.map(c=>`<div class="comment"><b>${esc(cm.get(c.author_id)||'مستخدم')}</b> ${esc(c.body)}</div>`).join('')}</div><div class="comment-box"><input data-comment="${p.id}" placeholder="اكتب تعليقًا…"><button data-send="${p.id}">إرسال</button></div></div>`;
      f.appendChild(el);
    }
    f.dataset.loading='0';
  }

  function renderIncomingPost(p){const f=feed();if(!f||!p?.id||p.visibility!=='public'||article(p.id))return;const el=document.createElement('article');el.className='card post';el.id='post-'+p.id;el.innerHTML=`<div class="post-head"><button class="avatar" data-profile="${p.author_id||''}">م</button><div><button class="post-name profile-link" data-profile="${p.author_id||''}">مستخدم Mada</button><div class="post-time">${new Date(p.created_at).toLocaleString('ar-EG')}</div></div></div><div class="post-text">${esc(p.body||'')}</div>${p.media_url?`<img class="post-image" src="${esc(p.media_url)}" alt="صورة المنشور" loading="lazy">`:''}<div class="post-meta"><span>👍 0</span><button class="meta-link" data-comments-open="${p.id}">0 تعليق</button><span>0 مشاركة</span></div><div class="post-actions"><button class="like" data-id="${p.id}" data-liked="false">👍 أعجبني <b class="action-count">0</b></button><button class="comment-toggle" data-comment-toggle="${p.id}">💬 تعليق</button><button class="share" data-id="${p.id}">↗️ مشاركة</button></div><div class="comments" data-comments="${p.id}"><div class="comment-box"><input data-comment="${p.id}" placeholder="اكتب تعليقًا…"><button data-send="${p.id}">إرسال</button></div></div>`;f.prepend(el);setTimeout(()=>loadPostExtras(p.id),50)}
  async function loadPostExtras(id){const s=sb(),u=currentUser(),el=article(id);if(!s||!el)return;const [likes,comments]=await Promise.all([s.from('post_likes').select('user_id').eq('post_id',id),s.from('comments').select('id,author_id,body,created_at').eq('post_id',id).order('created_at',{ascending:true})]);const ls=likes.data||[],cs=comments.data||[];setLikeCount(el,ls.length,!!u&&ls.some(x=>x.user_id===u.id));updateMetaLike(el,ls.length);updateMetaComments(el,cs.length);const box=el.querySelector('.comments'),input=box?.querySelector('.comment-box');if(box&&input){box.querySelectorAll('.comment:not([data-temp])').forEach(x=>x.remove());cs.forEach(c=>{const d=document.createElement('div');d.className='comment';d.innerHTML=`<b>مستخدم</b> ${esc(c.body)}`;box.insertBefore(d,input)})}}
  function bind(){const f=feed();if(!f)return false;f.addEventListener('click',e=>{const like=e.target.closest('.post-actions .like');if(like){e.preventDefault();e.stopImmediatePropagation();toggleLike(like);return}const send=e.target.closest('[data-send]');if(send){e.preventDefault();e.stopImmediatePropagation();const i=send.closest('.comment-box')?.querySelector(`[data-comment="${send.dataset.send}"]`);addComment(i)}},true);f.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){const i=e.target.closest('[data-comment]');if(i){e.preventDefault();addComment(i)}}},true);return true}
  function subscribe(){const s=sb(),u=currentUser();if(!s||!u||postChannel)return;postChannel=s.channel('mada-feed-posts').on('postgres_changes',{event:'INSERT',schema:'public',table:'posts',filter:'visibility=eq.public'},x=>renderIncomingPost(x.new)).subscribe();likeChannel=s.channel('mada-feed-likes').on('postgres_changes',{event:'*',schema:'public',table:'post_likes'},x=>{const id=x.new?.post_id||x.old?.post_id;if(id)loadPostExtras(id)}).subscribe();commentChannel=s.channel('mada-feed-comments').on('postgres_changes',{event:'*',schema:'public',table:'comments'},x=>{const id=x.new?.post_id||x.old?.post_id;if(id)loadPostExtras(id)}).subscribe()}
  function boot(){if(!bind())return setTimeout(boot,300);subscribe();if(typeof window.loadFeed==='function'){window.loadFeed=optimizedLoadFeed}if(currentUser())optimizedLoadFeed()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();