/* Mada feed rescue v3: direct posts query with no foreign-key embedding. */
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
      const u=await timeout(sb.auth.getUser(),8000);
      const currentUser=u?.data?.user;
      if(!currentUser)throw new Error('لم يتم العثور على جلسة المستخدم');

      /* Do NOT embed profiles here. A broken/mismatched FK relation must never hide posts. */
      const pr=await timeout(sb.from('posts').select('id,author_id,body,media_url,created_at').eq('visibility','public').order('created_at',{ascending:false}).limit(20),10000);
      if(pr.error)throw pr.error;
      const posts=pr.data||[];
      if(!posts.length){
        feed.innerHTML='<div class="card empty">لا توجد منشورات بعد. كن أول من ينشر في Mada 👋</div>';
        return;
      }

      const authorIds=[...new Set(posts.map(p=>p.author_id).filter(Boolean))];
      let profiles=[];
      if(authorIds.length){
        try{const r=await timeout(sb.from('profiles').select('id,display_name,avatar_url').in('id',authorIds),5000);if(!r.error)profiles=r.data||[];}catch(_){}}
      const pm=new Map(profiles.map(p=>[p.id,p]));

      let likes=[],comments=[];
      const ids=posts.map(p=>p.id);
      try{const r=await timeout(sb.from('post_likes').select('post_id,user_id,reaction_type').in('post_id',ids),5000);if(!r.error)likes=r.data||[];}catch(_){ }
      try{const r=await timeout(sb.from('comments').select('id,post_id,author_id,body,created_at').in('post_id',ids).order('created_at',{ascending:true}),5000);if(!r.error)comments=r.data||[];}catch(_){ }
      const lb=new Map(),cb=new Map();
      likes.forEach(x=>{if(!lb.has(x.post_id))lb.set(x.post_id,[]);lb.get(x.post_id).push(x);});
      comments.forEach(x=>{if(!cb.has(x.post_id))cb.set(x.post_id,[]);cb.get(x.post_id).push(x);});
      window.user=currentUser;
      window.feedPosts=new Map(posts.map(p=>[p.id,p]));
      const frag=document.createDocumentFragment();
      posts.forEach(p=>{
        const ls=lb.get(p.id)||[],cs=cb.get(p.id)||[],mine=ls.find(x=>x.user_id===currentUser.id),author=pm.get(p.author_id)||{};
        const el=document.createElement('article');el.className='card post';el.dataset.postId=p.id;
        el.innerHTML=`<div class="post-head"><div class="avatar">${esc(initials(author.display_name))}</div><div><div class="post-name">${esc(author.display_name||'مستخدم Mada')}</div><div class="post-time">${esc(fmt(p.created_at))}</div></div></div><div class="post-text">${esc(p.body||'')}</div>${p.media_url?`<img class="post-image" loading="lazy" src="${esc(p.media_url)}" alt="صورة المنشور">`:''}<div class="post-actions"><button class="like ${mine?'liked':''}" data-id="${esc(p.id)}" data-liked="${!!mine}">👍 إعجاب ${ls.length}</button><button class="comment-toggle" data-id="${esc(p.id)}">💬 تعليق ${cs.length}</button><button class="share" data-id="${esc(p.id)}">↗️ مشاركة</button></div></div>`;
        frag.appendChild(el);
      });
      feed.replaceChildren(frag);
      feed.classList.remove('is-loading');
    }catch(e){
      console.error('Mada feed rescue v3:',e);
      feed.innerHTML='<div class="card empty">تعذر تحميل المنشورات الآن.<br><small>تحقق من الاتصال ثم حاول مرة أخرى.</small></div>';
    }finally{busy=false;}
  }
  function boot(){
    [1000,2500,5000,9000].forEach(ms=>setTimeout(directLoad,ms));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(directLoad,500);});
    window.addEventListener('pageshow',()=>setTimeout(directLoad,500),{passive:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.madaFeedRescue={refresh:directLoad};
})();
