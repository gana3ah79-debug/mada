/* Mada: emergency feed renderer v2. Wait for auth before querying RLS-protected posts. */
(function(){
  'use strict';
  let busy=false, timer=null, authChannel=null;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const initial=s=>(String(s||'م').trim().charAt(0)||'م');
  const date=v=>{try{return new Date(v).toLocaleString('ar-EG',{dateStyle:'short',timeStyle:'short'});}catch(_){return ''}};
  async function client(){
    for(let i=0;i<40;i++){
      if(window.sb)return window.sb;
      if(window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY){
        try{return window.sb=window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);}catch(_){}
      }
      await sleep(250);
    }
    throw new Error('supabase_not_ready');
  }
  async function sessionReady(sb){
    for(let i=0;i<30;i++){
      try{
        const r=await sb.auth.getSession();
        const s=r.data?.session;
        if(s?.user?.id){window.user=s.user;return s;}
      }catch(_){ }
      await sleep(300);
    }
    return null;
  }
  async function query(make,ms){return Promise.race([make(),new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))]);}
  function render(p,a,likes,comments,uid){
    const mine=likes.find(x=>x.user_id===uid);
    const el=document.createElement('article');el.className='card post';el.dataset.postId=p.id;
    el.innerHTML=`<div class="post-head"><div class="avatar">${initial(a?.display_name)}</div><div><div class="post-name">${esc(a?.display_name||'مستخدم Mada')}</div><div class="post-time">${date(p.created_at)}</div></div></div><div class="post-text">${esc(p.body||'')}</div>${p.media_url?`<img class="post-image" loading="lazy" src="${esc(p.media_url)}" alt="صورة المنشور">`:''}<div class="post-actions"><button class="like ${mine?'liked':''}" data-id="${p.id}" data-liked="${!!mine}" ${mine?.reaction_type?`data-reaction="${esc(mine.reaction_type)}"`:''}>👍 إعجاب ${likes.length}</button><button class="comment-toggle" data-id="${p.id}">💬 تعليق ${comments.length}</button><button class="share" data-id="${p.id}">↗️ مشاركة</button></div></div>`;
    return el;
  }
  async function load(){
    if(busy)return false;
    const feed=document.getElementById('feed');if(!feed)return false;
    busy=true;
    try{
      const sb=await client();
      const session=await sessionReady(sb);
      if(!session)throw new Error('session_not_ready');
      const uid=session.user.id;
      const r=await query(()=>sb.from('posts').select('id,author_id,body,media_url,created_at,visibility').eq('visibility','public').order('created_at',{ascending:false}).limit(20),15000);
      if(r.error)throw r.error;
      const posts=r.data||[];
      if(!posts.length){feed.innerHTML='<div class="card empty">لا توجد منشورات بعد. كن أول من ينشر في Mada 👋</div>';return true;}
      const ids=posts.map(p=>p.id), aids=[...new Set(posts.map(p=>p.author_id).filter(Boolean))];
      const [pr,lr,cr]=await Promise.allSettled([
        aids.length?query(()=>sb.from('profiles').select('id,display_name,avatar_url').in('id',aids),7000):Promise.resolve({data:[]}),
        query(()=>sb.from('post_likes').select('post_id,user_id,reaction_type').in('post_id',ids),7000),
        query(()=>sb.from('comments').select('id,post_id,author_id,body,created_at,profiles!comments_author_id_fkey(display_name)').in('post_id',ids).order('created_at',{ascending:true}),7000)
      ]);
      const profiles=pr.status==='fulfilled'&&!pr.value.error?(pr.value.data||[]):[];
      const likes=lr.status==='fulfilled'&&!lr.value.error?(lr.value.data||[]):[];
      const comments=cr.status==='fulfilled'&&!cr.value.error?(cr.value.data||[]):[];
      const amap=new Map(profiles.map(x=>[x.id,x])), lm=new Map(),cm=new Map();
      likes.forEach(x=>{if(!lm.has(x.post_id))lm.set(x.post_id,[]);lm.get(x.post_id).push(x)});
      comments.forEach(x=>{if(!cm.has(x.post_id))cm.set(x.post_id,[]);cm.get(x.post_id).push(x)});
      window.feedPosts=new Map(posts.map(p=>[p.id,p]));
      const frag=document.createDocumentFragment();posts.forEach(p=>frag.appendChild(render(p,amap.get(p.author_id),lm.get(p.id)||[],cm.get(p.id)||[],uid)));
      feed.replaceChildren(frag);feed.classList.remove('is-loading');
      return true;
    }catch(e){console.warn('Mada emergency feed v2:',e);return false}
    finally{busy=false;}
  }
  function install(){
    window.madaEmergencyFeed=load;
    const tryLoad=()=>{if(!document.hidden)load();};
    [0,1200,3000,6000,10000,16000,25000,40000].forEach(ms=>setTimeout(tryLoad,ms));
    clearInterval(timer);timer=setInterval(tryLoad,30000);
    window.addEventListener('pageshow',()=>setTimeout(tryLoad,500),{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(tryLoad,300);});
    const sb=window.sb;
    try{
      if(sb?.auth?.onAuthStateChange){
        authChannel=sb.auth.onAuthStateChange((event,session)=>{
          if(session?.user?.id){window.user=session.user;setTimeout(tryLoad,100);}
        });
      }
    }catch(_){ }
    const app=document.getElementById('app');
    if(app)new MutationObserver(()=>{if(!app.hidden)setTimeout(tryLoad,150);}).observe(app,{attributes:true,attributeFilter:['hidden']});
    const feed=document.getElementById('feed');
    if(feed)new MutationObserver(()=>{if(!feed.querySelector('article.post')){clearTimeout(feed._emergencyTimer);feed._emergencyTimer=setTimeout(tryLoad,400);}}).observe(feed,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
