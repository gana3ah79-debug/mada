/* Mada backend sync: realtime feed + optimistic likes/comments. */
(function(){
  const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  let postChannel=null, likeChannel=null, commentChannel=null;
  const seen=new Set();
  function currentUser(){return window.user||null}
  function feed(){return document.getElementById('feed')}
  function article(id){return document.getElementById('post-'+id)}
  function setLikeCount(el,count,liked){
    const btn=el?.querySelector('.post-actions .like'); if(!btn)return;
    btn.dataset.liked=liked?'true':'false'; btn.classList.toggle('liked',liked);
    const old=btn.querySelector('.action-count');
    if(old) old.textContent=String(count); else btn.innerHTML=`<span class="action-icon">${liked?'💙':'👍'}</span><span>${liked?'أعجبني':'إعجاب'}</span><b class="action-count">${count}</b>`;
  }
  function ensureMeta(el){let m=el?.querySelector('.post-meta');if(!m){m=document.createElement('div');m.className='post-meta';const actions=el.querySelector('.post-actions');actions?.before(m)}return m}
  function updateMetaLike(el,count){const m=ensureMeta(el);const spans=m.querySelectorAll(':scope > span');if(spans[0])spans[0].textContent=`👍 ${count}`}
  function updateMetaComments(el,count){const m=ensureMeta(el);let b=m.querySelector('[data-comments-open]');if(!b){b=document.createElement('button');b.className='meta-link';b.dataset.commentsOpen=el.id.slice(5);m.appendChild(b)}b.textContent=`${count} تعليق`}
  async function toggleLike(btn){
    const s=sb(), u=currentUser(), id=btn?.dataset.id; if(!s||!u||!id)return;
    const el=article(id); const was=btn.dataset.liked==='true';
    const oldCount=Number(btn.querySelector('.action-count')?.textContent||el?.querySelector('.post-meta span')?.textContent?.match(/\d+/)?.[0]||0);
    const next=Math.max(0,oldCount+(was?-1:1));
    setLikeCount(el,next,!was); updateMetaLike(el,next); btn.disabled=true;
    try{
      const r=was?await s.from('post_likes').delete().eq('post_id',id).eq('user_id',u.id):await s.from('post_likes').insert({post_id:id,user_id:u.id});
      if(r.error)throw r.error;
    }catch(e){setLikeCount(el,oldCount,was);updateMetaLike(el,oldCount);alert('تعذر حفظ الإعجاب: '+e.message)}finally{btn.disabled=false}
  }
  async function addComment(input){
    const s=sb(),u=currentUser(),id=input?.dataset.comment,body=input?.value.trim();if(!s||!u||!id||!body)return;
    const box=input.closest('.comments'); const send=box?.querySelector(`[data-send="${id}"]`); if(send)send.disabled=true;
    const temp=document.createElement('div');temp.className='comment';temp.dataset.temp='1';temp.innerHTML=`<b>أنت</b> ${esc(body)}`;box?.insertBefore(temp,box.querySelector('.comment-box'));
    const old=input.value;input.value='';
    const count=Number(article(id)?.querySelector('.post-meta .meta-link')?.textContent?.match(/\d+/)?.[0]||0)+1; updateMetaComments(article(id),count);
    try{const r=await s.from('comments').insert({post_id:id,author_id:u.id,body});if(r.error)throw r.error;temp.remove()}catch(e){temp.remove();input.value=old;updateMetaComments(article(id),Math.max(0,count-1));alert('تعذر إضافة التعليق: '+e.message)}finally{if(send)send.disabled=false}
  }
  function renderIncomingPost(p){
    const f=feed(); if(!f||!p?.id||p.visibility!=='public'||article(p.id))return;
    const u=currentUser();
    const el=document.createElement('article');el.className='card post';el.id='post-'+p.id;
    el.innerHTML=`<div class="post-head"><button class="avatar" data-profile="${p.author_id}">م</button><div><button class="post-name profile-link" data-profile="${p.author_id}">مستخدم Mada</button><div class="post-time">${new Date(p.created_at).toLocaleString('ar-EG')}</div></div></div><div class="post-text">${esc(p.body||'')}</div>${p.media_url?`<img class="post-image" src="${esc(p.media_url)}" alt="صورة المنشور" loading="lazy">`:''}<div class="post-meta"><span>👍 0</span><button class="meta-link" data-comments-open="${p.id}">0 تعليق</button><span>0 مشاركة</span></div><div class="post-actions"><button class="like" data-id="${p.id}" data-liked="false">👍 أعجبني <b class="action-count">0</b></button><button class="comment-toggle" data-comment-toggle="${p.id}">💬 تعليق</button><button class="share" data-id="${p.id}">↗️ مشاركة</button></div><div class="comments" data-comments="${p.id}"><div class="comment-box"><input data-comment="${p.id}" placeholder="اكتب تعليقًا…"><button data-send="${p.id}">إرسال</button></div></div>`;
    f.prepend(el);setTimeout(()=>loadPostExtras(p.id),50);
  }
  async function loadPostExtras(id){
    const s=sb(),u=currentUser(),el=article(id);if(!s||!el)return;
    const [p,likes,comments]=await Promise.all([s.from('posts').select('id,author_id,body,media_url,created_at,visibility').eq('id',id).maybeSingle(),s.from('post_likes').select('user_id').eq('post_id',id),s.from('comments').select('id,author_id,body,created_at').eq('post_id',id).order('created_at',{ascending:true})]);
    if(p.data?.author_id){const a=await s.from('profiles').select('display_name,avatar_url').eq('id',p.data.author_id).maybeSingle();const name=el.querySelector('.post-name');if(name)name.textContent=a.data?.display_name||'مستخدم Mada';}
    const ls=likes.data||[],cs=comments.data||[];setLikeCount(el,ls.length,!!u&&ls.some(x=>x.user_id===u.id));updateMetaLike(el,ls.length);updateMetaComments(el,cs.length);
    const box=el.querySelector('.comments'),input=box?.querySelector('.comment-box');if(box&&input){box.querySelectorAll('.comment:not([data-temp])').forEach(x=>x.remove());cs.forEach(c=>{const d=document.createElement('div');d.className='comment';d.innerHTML=`<b>مستخدم</b> ${esc(c.body)}`;box.insertBefore(d,input)});}
  }
  function bind(){
    const f=feed();if(!f)return false;
    f.addEventListener('click',e=>{const like=e.target.closest('.post-actions .like');if(like){e.preventDefault();e.stopImmediatePropagation();toggleLike(like);return}const send=e.target.closest('[data-send]');if(send){e.preventDefault();e.stopImmediatePropagation();const i=send.closest('.comment-box')?.querySelector(`[data-comment="${send.dataset.send}"]`);addComment(i)}},true);
    f.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){const i=e.target.closest('[data-comment]');if(i){e.preventDefault();addComment(i)}}},true);
    return true;
  }
  function subscribe(){
    const s=sb(),u=currentUser();if(!s||!u||postChannel)return;
    postChannel=s.channel('mada-feed-posts').on('postgres_changes',{event:'INSERT',schema:'public',table:'posts',filter:'visibility=eq.public'},payload=>{renderIncomingPost(payload.new)}).subscribe();
    likeChannel=s.channel('mada-feed-likes').on('postgres_changes',{event:'*',schema:'public',table:'post_likes'},payload=>{const id=payload.new?.post_id||payload.old?.post_id;if(id)loadPostExtras(id)}).subscribe();
    commentChannel=s.channel('mada-feed-comments').on('postgres_changes',{event:'*',schema:'public',table:'comments'},payload=>{const id=payload.new?.post_id||payload.old?.post_id;if(id)loadPostExtras(id)}).subscribe();
  }
  function boot(){if(!bind())return setTimeout(boot,500);subscribe();new MutationObserver(()=>{if(!postChannel)subscribe()}).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();