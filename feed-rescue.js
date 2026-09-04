/* Mada feed rescue v2: direct feed load that cannot remain on the loading placeholder. */
(function(){
  'use strict';
  let busy=false;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const initials=n=>(String(n||'م').trim().charAt(0)||'م');
  const fmt=v=>{try{return new Date(v).toLocaleString('ar-EG',{dateStyle:'short',timeStyle:'short'});}catch(_){return '';}};
  const timeout=(p,ms)=>Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))]);
  async function directLoad(){
    if(busy)return;
    const app=document.getElementById('app'),feed=document.getElementById('feed');
    if(!app||app.hidden||!feed)return;
    if(feed.querySelector('article.post'))return;
    busy=true;
    try{
      const sb=window.supabase?.createClient?.(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
      if(!sb)throw new Error('Supabase غير جاهز');
      const ures=await timeout(sb.auth.getUser(),8000);
      const currentUser=ures?.data?.user;
      if(!currentUser)throw new Error('لم يتم العثور على جلسة المستخدم');
      const postsRes=await timeout(sb.from('posts').select('id,author_id,body,media_url,created_at,profiles!posts_author_id_fkey(display_name,avatar_url)').eq('visibility','public').order('created_at',{ascending:false}).limit(20),10000);
      if(postsRes.error)throw postsRes.error;
      const posts=postsRes.data||[];
      if(!posts.length){feed.innerHTML='<div class="card empty">لا توجد منشورات بعد. كن أول من ينشر في Mada 👋</div>';return;}
      const ids=posts.map(p=>p.id);
      let likes=[],comments=[];
      try{const r=await timeout(sb.from('post_likes').select('post_id,user_id,reaction_type').in('post_id',ids),6000);if(!r.error)likes=r.data||[];}catch(_){ }
      try{const r=await timeout(sb.from('comments').select('id,post_id,author_id,body,created_at,profiles!comments_author_id_fkey(display_name)').in('post_id',ids).order('created_at',{ascending:true}),6000);if(!r.error)comments=r.data||[];}catch(_){ }
      const lb=new Map(),cb=new Map();
      likes.forEach(x=>{if(!lb.has(x.post_id))lb.set(x.post_id,[]);lb.get(x.post_id).push(x);});
      comments.forEach(x=>{if(!cb.has(x.post_id))cb.set(x.post_id,[]);cb.get(x.post_id).push(x);});
      window.user=currentUser;
      window.feedPosts=new Map(posts.map(p=>[p.id,p]));
      const frag=document.createDocumentFragment();
      posts.forEach(p=>{
        const ls=lb.get(p.id)||[],cs=cb.get(p.id)||[],mine=ls.find(x=>x.user_id===currentUser.id),author=p.profiles||{};
        const el=document.createElement('article');el.className='card post';el.dataset.postId=p.id;
        el.innerHTML=`<div class="post-head"><div class="avatar">${initials(author.display_name)}</div><div><div class="post-name">${esc(author.display_name||'مستخدم Mada')}</div><div class="post-time">${fmt(p.created_at)}</div></div></div><div class="post-text">${esc(p.body||'')}</div>${p.media_url?`<img class="post-image" loading="lazy" src="${esc(p.media_url)}" alt="صورة المنشور">`:''}<div class="post-actions"><button class="like ${mine?'liked':''}" data-id="${p.id}" data-liked="${!!mine}" ${mine?.reaction_type?`data-reaction="${esc(mine.reaction_type)}"`:''}>👍 إعجاب ${ls.length}</button><button class="comment-toggle" data-id="${p.id}">💬 تعليق ${cs.length}</button><button class="share" data-id="${p.id}">↗️ مشاركة</button></div><div class="comments"><div class="comment-list">${cs.slice(0,20).map(c=>`<div class="comment"><b>${esc(c.profiles?.display_name||'مستخدم')}</b> ${esc(c.body)}</div>`).join('')}</div></div>`;
        frag.appendChild(el);
      });
      feed.replaceChildren(frag);
      feed.classList.remove('is-loading');
      try{window.madaHomeFeed?.setMode?.('latest');}catch(_){ }
    }catch(e){
      console.error('Mada feed rescue v2:',e);
      feed.innerHTML='<div class="card empty">تعذر تحميل المنشورات الآن.<br><small>اضغط تحديث الصفحة وحاول مرة أخرى.</small></div>';
    }finally{busy=false;}
  }
  function boot(){
    [1200,3000,6000,10000].forEach(ms=>setTimeout(directLoad,ms));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(directLoad,500);});
    window.addEventListener('pageshow',()=>setTimeout(directLoad,500),{passive:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.madaFeedRescue={refresh:directLoad};
})();
