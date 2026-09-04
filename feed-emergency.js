/* Mada Feed Unified v2 - fast first paint + resilient feed watchdog. */
(function(){
  'use strict';
  let busy=false, retryTimer=null, installed=false, enrichToken=0;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const initial=s=>(String(s||'م').trim().charAt(0)||'م');
  const date=v=>{try{return new Date(v).toLocaleString('ar-EG',{dateStyle:'short',timeStyle:'short'});}catch(_){return ''}};
  async function getClient(){
    for(let i=0;i<30;i++){
      if(window.sb)return window.sb;
      if(window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY){
        try{return window.sb=window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);}catch(_){}
      }
      await sleep(200);
    }
    throw new Error('supabase_not_ready');
  }
  async function getSession(sb){
    try{
      const r=await sb.auth.getSession();
      const s=r.data?.session;
      if(s?.user?.id){window.user=s.user;return s;}
    }catch(_){ }
    return null;
  }
  async function q(make,ms){
    return Promise.race([make(),new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))]);
  }
  function renderPost(p,a,likes,comments,uid){
    const mine=likes.find(x=>x.user_id===uid);
    const el=document.createElement('article');
    el.className='card post'; el.dataset.postId=p.id;
    el.innerHTML=`<div class="post-head"><div class="avatar">${initial(a?.display_name)}</div><div><div class="post-name">${esc(a?.display_name||'مستخدم Mada')}</div><div class="post-time">${date(p.created_at)}</div></div></div><div class="post-text">${esc(p.body||'')}</div>${p.media_url?`<img class="post-image" loading="lazy" src="${esc(p.media_url)}" alt="صورة المنشور">`:''}<div class="post-actions"><button class="like ${mine?'liked':''}" data-id="${p.id}" data-liked="${!!mine}" ${mine?.reaction_type?`data-reaction="${esc(mine.reaction_type)}"`:''}>👍 إعجاب ${likes.length}</button><button class="comment-toggle" data-id="${p.id}">💬 تعليق ${comments.length}</button><button class="share" data-id="${p.id}">↗️ مشاركة</button></div></article>`;
    return el;
  }
  function patchPost(el,author,likes,comments,uid){
    if(!el?.isConnected)return;
    const avatar=el.querySelector('.post-head .avatar');
    const name=el.querySelector('.post-name');
    const like=el.querySelector('.like');
    const comment=el.querySelector('.comment-toggle');
    const mine=likes.find(x=>x.user_id===uid);
    if(avatar)avatar.textContent=initial(author?.display_name);
    if(name)name.textContent=author?.display_name||'مستخدم Mada';
    if(like){like.textContent=`👍 إعجاب ${likes.length}`;like.dataset.liked=String(!!mine);like.classList.toggle('liked',!!mine);if(mine?.reaction_type)like.dataset.reaction=mine.reaction_type;else delete like.dataset.reaction;}
    if(comment)comment.textContent=`💬 تعليق ${comments.length}`;
  }
  async function loadFeed(){
    if(busy)return false;
    const feed=document.getElementById('feed');
    const app=document.getElementById('app');
    if(!feed || app?.hidden)return false;
    busy=true;
    const token=++enrichToken;
    try{
      const sb=await getClient();
      const session=await getSession(sb);
      if(!session)return false;
      const uid=session.user.id;
      const postsRes=await q(()=>sb.from('posts').select('id,author_id,body,media_url,created_at,visibility').eq('visibility','public').order('created_at',{ascending:false}).limit(20),12000);
      if(postsRes.error)throw postsRes.error;
      const posts=postsRes.data||[];
      if(!posts.length){feed.innerHTML='<div class="card empty">لا توجد منشورات بعد. كن أول من ينشر في Mada 👋</div>';return true;}
      window.feedPosts=new Map(posts.map(p=>[p.id,p]));
      const frag=document.createDocumentFragment();
      posts.forEach(p=>frag.appendChild(renderPost(p,null,[],[],uid)));
      feed.replaceChildren(frag);
      feed.classList.remove('is-loading');

      /* Enrich after the first paint. Any secondary query can fail without hiding posts. */
      const ids=posts.map(p=>p.id),aids=[...new Set(posts.map(p=>p.author_id).filter(Boolean))];
      Promise.allSettled([
        aids.length?q(()=>sb.from('profiles').select('id,display_name,avatar_url').in('id',aids),5000):Promise.resolve({data:[]}),
        q(()=>sb.from('post_likes').select('post_id,user_id,reaction_type').in('post_id',ids),5000),
        q(()=>sb.from('comments').select('id,post_id,author_id,body,created_at,profiles!comments_author_id_fkey(display_name)').in('post_id',ids).order('created_at',{ascending:true}),5000)
      ]).then(results=>{
        if(token!==enrichToken)return;
        const profiles=results[0].status==='fulfilled'&&!results[0].value.error?(results[0].value.data||[]):[];
        const likes=results[1].status==='fulfilled'&&!results[1].value.error?(results[1].value.data||[]):[];
        const comments=results[2].status==='fulfilled'&&!results[2].value.error?(results[2].value.data||[]):[];
        const authors=new Map(profiles.map(x=>[x.id,x])),lb=new Map(),cb=new Map();
        likes.forEach(x=>{if(!lb.has(x.post_id))lb.set(x.post_id,[]);lb.get(x.post_id).push(x);});
        comments.forEach(x=>{if(!cb.has(x.post_id))cb.set(x.post_id,[]);cb.get(x.post_id).push(x);});
        posts.forEach(p=>patchPost(feed.querySelector(`article[data-post-id="${CSS.escape(p.id)}"]`),authors.get(p.author_id),lb.get(p.id)||[],cb.get(p.id)||[],uid));
      }).catch(()=>{});
      return true;
    }catch(e){
      console.warn('Mada unified feed:',e);
      return false;
    }finally{busy=false;}
  }
  function schedule(ms=500){
    clearTimeout(retryTimer);
    retryTimer=setTimeout(async()=>{
      const ok=await loadFeed();
      if(!ok)schedule(1500);
    },ms);
  }
  function install(){
    if(installed)return; installed=true;
    window.loadFeed=loadFeed;
    window.madaFeed={load:loadFeed,refresh:loadFeed};
    [0,500,1400,3000,7000].forEach(ms=>setTimeout(loadFeed,ms));
    window.addEventListener('pageshow',()=>schedule(200),{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(200);});
    try{
      if(window.sb?.auth?.onAuthStateChange)window.sb.auth.onAuthStateChange((_event,session)=>{if(session?.user?.id){window.user=session.user;schedule(100);}});
    }catch(_){ }
    const app=document.getElementById('app');
    if(app)new MutationObserver(()=>{if(!app.hidden)schedule(100);}).observe(app,{attributes:true,attributeFilter:['hidden']});
    const feed=document.getElementById('feed');
    if(feed)new MutationObserver(()=>{
      if(document.getElementById('app')?.hidden)return;
      if(!feed.querySelector('article.post')&&!feed.querySelector('.empty'))schedule(150);
    }).observe(feed,{childList:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
