/* Mada feed guard v1: last-resort feed loader. It owns the visible feed and never leaves an error card behind. */
(function(){
  'use strict';
  let loading=false, retryTimer=null;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const initial=s=>(String(s||'م').trim().charAt(0)||'م');
  const date=v=>{try{return new Date(v).toLocaleString('ar-EG',{dateStyle:'short',timeStyle:'short'});}catch(_){return '';}};
  async function client(){
    for(let i=0;i<30;i++){
      if(window.sb)return window.sb;
      if(window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY){
        try{return window.sb=window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);}catch(_){}}
      await wait(250);
    }
    throw new Error('supabase_not_ready');
  }
  async function q(make,ms){return Promise.race([make(),new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))]);}
  function render(p,a,likes,comments,uid){
    const mine=likes.find(x=>x.user_id===uid);
    const el=document.createElement('article'); el.className='card post'; el.dataset.postId=p.id;
    el.innerHTML=`<div class="post-head"><div class="avatar">${initial(a?.display_name)}</div><div><div class="post-name">${esc(a?.display_name||'مستخدم Mada')}</div><div class="post-time">${date(p.created_at)}</div></div></div><div class="post-text">${esc(p.body||'')}</div>${p.media_url?`<img class="post-image" loading="lazy" src="${esc(p.media_url)}" alt="صورة المنشور">`:''}<div class="post-actions"><button class="like ${mine?'liked':''}" data-id="${p.id}" data-liked="${!!mine}" ${mine?.reaction_type?`data-reaction="${esc(mine.reaction_type)}"`:''}>👍 إعجاب ${likes.length}</button><button class="comment-toggle" data-id="${p.id}">💬 تعليق ${comments.length}</button><button class="share" data-id="${p.id}">↗️ مشاركة</button></div></article>`;
    return el;
  }
  async function load(){
    if(loading)return;
    const feed=document.getElementById('feed');
    if(!feed)return;
    loading=true;
    try{
      const sb=await client();
      const session=(await sb.auth.getSession()).data?.session;
      const uid=session?.user?.id||window.user?.id||null;
      if(session)window.user=session.user;
      const postsRes=await q(()=>sb.from('posts').select('id,author_id,body,media_url,created_at,visibility').eq('visibility','public').order('created_at',{ascending:false}).limit(20),12000);
      if(postsRes.error)throw postsRes.error;
      const posts=postsRes.data||[];
      if(!posts.length){feed.innerHTML='<div class="card empty">لا توجد منشورات بعد. كن أول من ينشر في Mada 👋</div>';return true;}
      const ids=posts.map(p=>p.id), aids=[...new Set(posts.map(p=>p.author_id).filter(Boolean))];
      const rs=await Promise.allSettled([
        aids.length?q(()=>sb.from('profiles').select('id,display_name,avatar_url').in('id',aids),7000):Promise.resolve({data:[]}),
        q(()=>sb.from('post_likes').select('post_id,user_id,reaction_type').in('post_id',ids),7000),
        q(()=>sb.from('comments').select('id,post_id,author_id,body,created_at,profiles!comments_author_id_fkey(display_name)').in('post_id',ids).order('created_at',{ascending:true}),7000)
      ]);
      const profiles=rs[0].status==='fulfilled'&&!rs[0].value.error?(rs[0].value.data||[]):[];
      const likes=rs[1].status==='fulfilled'&&!rs[1].value.error?(rs[1].value.data||[]):[];
      const comments=rs[2].status==='fulfilled'&&!rs[2].value.error?(rs[2].value.data||[]):[];
      const authors=new Map(profiles.map(x=>[x.id,x])), lb=new Map(), cb=new Map();
      likes.forEach(x=>{if(!lb.has(x.post_id))lb.set(x.post_id,[]);lb.get(x.post_id).push(x);});
      comments.forEach(x=>{if(!cb.has(x.post_id))cb.set(x.post_id,[]);cb.get(x.post_id).push(x);});
      const frag=document.createDocumentFragment(); posts.forEach(p=>frag.appendChild(render(p,authors.get(p.author_id),lb.get(p.id)||[],cb.get(p.id)||[],uid)));
      feed.replaceChildren(frag); feed.classList.remove('is-loading');
      window.feedPosts=new Map(posts.map(p=>[p.id,p]));
      return true;
    }catch(e){
      console.error('Mada feed guard:',e);
      return false;
    }finally{loading=false;}
  }
  function kick(){
    clearTimeout(retryTimer);
    retryTimer=setTimeout(async()=>{const f=document.getElementById('feed');if(f&&!f.querySelector('article.post')){const ok=await load();if(!ok)kick();}},1500);
  }
  function install(){
    window.madaGuardLoadFeed=load;
    window.loadFeed=load;
    const feed=document.getElementById('feed');
    if(feed){
      const mo=new MutationObserver(()=>{
        const text=(feed.textContent||'').trim();
        if(!feed.querySelector('article.post') && (text.includes('تعذر تحميل المنشورات')||text.includes('جاري إعادة المحاولة')||text.includes('جاري تحميل المنشورات')||text.includes('جاري تجهيز المنشورات'))){
          feed.replaceChildren(); kick();
        }
      });
      mo.observe(feed,{childList:true,subtree:true,characterData:true});
    }
    [250,1000,2500,5000,10000,20000].forEach(ms=>setTimeout(load,ms));
    setInterval(()=>{const f=document.getElementById('feed');if(f&&!f.querySelector('article.post'))load();},10000);
    window.addEventListener('pageshow',()=>setTimeout(load,500),{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(load,500);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
