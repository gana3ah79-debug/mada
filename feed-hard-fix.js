/* Mada: stable feed loader v2. Wait for auth and refresh stale sessions before loading the feed. */
(function(){
  'use strict';
  let busy=false;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const initial=n=>(String(n||'م').trim().charAt(0)||'م');
  const date=v=>{try{return new Date(v).toLocaleString('ar-EG',{dateStyle:'short',timeStyle:'short'});}catch(_){return '';}};
  async function getSession(sb){
    for(let i=0;i<15;i++){
      try{
        const r=await sb.auth.getSession();
        const s=r.data?.session;
        if(s){
          const exp=Number(s.expires_at||0)*1000;
          if(!exp || exp>Date.now()+60000)return s;
          try{const rr=await sb.auth.refreshSession();if(rr.data?.session)return rr.data.session;}catch(_){ }
        }
      }catch(_){ }
      await sleep(400);
    }
    try{const r=await sb.auth.refreshSession();if(r.data?.session)return r.data.session;}catch(_){ }
    return null;
  }
  async function query(sb,make,ms){
    return await Promise.race([make(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),ms))]);
  }
  function render(p,author,likes,comments,uid){
    const mine=likes.find(x=>x.user_id===uid);
    const el=document.createElement('article');
    el.className='card post';el.dataset.postId=p.id;
    el.innerHTML=`<div class="post-head"><div class="avatar">${initial(author?.display_name)}</div><div><div class="post-name">${esc(author?.display_name||'مستخدم Mada')}</div><div class="post-time">${date(p.created_at)}</div></div></div><div class="post-text">${esc(p.body||'')}</div>${p.media_url?`<img class="post-image" loading="lazy" src="${esc(p.media_url)}" alt="صورة المنشور">`:''}<div class="post-actions"><button class="like ${mine?'liked':''}" data-id="${p.id}" data-liked="${!!mine}">👍 إعجاب ${likes.length}</button><button class="comment-toggle" data-id="${p.id}">💬 تعليق ${comments.length}</button><button class="share" data-id="${p.id}">↗️ مشاركة</button></div><div class="comments"><div class="comment-list">${comments.slice(0,20).map(c=>`<div class="comment"><b>${esc(c.profiles?.display_name||'مستخدم')}</b> ${esc(c.body)}</div>`).join('')}</div></div>`;
    return el;
  }
  async function load(){
    if(busy)return;
    const feed=document.getElementById('feed');
    if(!feed||document.getElementById('app')?.hidden)return;
    busy=true;
    try{
      const sb=window.sb||(window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY?window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY):null);
      if(!sb)throw new Error('supabase_not_ready');
      let session=await getSession(sb);
      if(!session)throw new Error('no_session');
      const uid=session.user.id;
      window.user=session.user;
      let postsRes=await query(sb,()=>sb.from('posts').select('id,author_id,body,media_url,created_at,visibility').eq('visibility','public').order('created_at',{ascending:false}).limit(20),12000);
      if(postsRes.error){
        try{const rr=await sb.auth.refreshSession();if(rr.data?.session){session=rr.data.session;postsRes=await query(sb,()=>sb.from('posts').select('id,author_id,body,media_url,created_at,visibility').eq('visibility','public').order('created_at',{ascending:false}).limit(20),12000);}}catch(_){ }
      }
      if(postsRes.error)throw postsRes.error;
      const posts=postsRes.data||[];
      if(!posts.length){feed.innerHTML='<div class="card empty">لا توجد منشورات بعد. كن أول من ينشر في Mada 👋</div>';return;}
      const ids=posts.map(p=>p.id), authorIds=[...new Set(posts.map(p=>p.author_id).filter(Boolean))];
      const [pr,lr,cr]=await Promise.allSettled([
        authorIds.length?query(sb,()=>sb.from('profiles').select('id,display_name,avatar_url').in('id',authorIds),7000):Promise.resolve({data:[],error:null}),
        query(sb,()=>sb.from('post_likes').select('post_id,user_id,reaction_type').in('post_id',ids),7000),
        query(sb,()=>sb.from('comments').select('id,post_id,author_id,body,created_at,profiles!comments_author_id_fkey(display_name)').in('post_id',ids).order('created_at',{ascending:true}),7000)
      ]);
      const profiles=pr.status==='fulfilled'&&!pr.value.error?(pr.value.data||[]):[];
      const likes=lr.status==='fulfilled'&&!lr.value.error?(lr.value.data||[]):[];
      const comments=cr.status==='fulfilled'&&!cr.value.error?(cr.value.data||[]):[];
      const authors=new Map(profiles.map(x=>[x.id,x])),lb=new Map(),cb=new Map();
      likes.forEach(x=>{if(!lb.has(x.post_id))lb.set(x.post_id,[]);lb.get(x.post_id).push(x);});
      comments.forEach(x=>{if(!cb.has(x.post_id))cb.set(x.post_id,[]);cb.get(x.post_id).push(x);});
      const frag=document.createDocumentFragment();
      posts.forEach(p=>frag.appendChild(render(p,authors.get(p.author_id),lb.get(p.id)||[],cb.get(p.id)||[],uid)));
      feed.replaceChildren(frag);feed.classList.remove('is-loading');
    }catch(e){
      console.error('Mada stable feed v2:',e);
      if(!feed.querySelector('article.post'))feed.innerHTML='<div class="card empty">جاري تجهيز المنشورات…</div>';
      setTimeout(load,2500);
    }finally{busy=false;}
  }
  function install(){
    window.loadFeed=load;
    [700,1800,3500,7000,12000].forEach(ms=>setTimeout(load,ms));
    window.addEventListener('pageshow',()=>setTimeout(load,500),{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(load,500);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
