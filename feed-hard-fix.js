/* Mada: harden home feed loading. Avoid nested profile joins so one relation cannot blank the feed. */
(function(){
  'use strict';
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  async function load(){
    const feed=document.getElementById('feed');
    const sb=window.sb || (window.supabase?.createClient && window.MADA_SUPABASE_URL && window.MADA_SUPABASE_KEY ? window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY) : null);
    if(!feed||!sb)return;
    let session=null;
    try{session=(await sb.auth.getSession()).data?.session||null;}catch(e){console.warn('Mada feed auth:',e);}
    if(!session)return;
    const currentUser=window.user||session.user;
    try{
      feed.innerHTML='<div class="card empty">جاري تحميل المنشورات…</div>';
      const postsRes=await Promise.race([
        sb.from('posts').select('id,author_id,body,media_url,created_at,visibility').eq('visibility','public').order('created_at',{ascending:false}).limit(20),
        new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),9000))
      ]);
      if(postsRes.error)throw postsRes.error;
      const posts=postsRes.data||[];
      if(!posts.length){feed.innerHTML='<div class="card empty">لا توجد منشورات بعد. كن أول من ينشر في Mada 👋</div>';return;}
      const ids=posts.map(p=>p.id);
      const authorIds=[...new Set(posts.map(p=>p.author_id).filter(Boolean))];
      const [profilesRes,likesRes,commentsRes]=await Promise.allSettled([
        authorIds.length?sb.from('profiles').select('id,display_name,avatar_url').in('id',authorIds):Promise.resolve({data:[],error:null}),
        sb.from('post_likes').select('post_id,user_id,reaction_type').in('post_id',ids),
        sb.from('comments').select('id,post_id,author_id,body,created_at').in('post_id',ids).order('created_at',{ascending:true})
      ]);
      const profiles=profilesRes.status==='fulfilled'?(profilesRes.value.data||[]):[];
      const likes=likesRes.status==='fulfilled'?(likesRes.value.data||[]):[];
      const comments=commentsRes.status==='fulfilled'?(commentsRes.value.data||[]):[];
      const byAuthor=new Map(profiles.map(x=>[x.id,x]));
      const likesBy=new Map(), commentsBy=new Map();
      likes.forEach(x=>{if(!likesBy.has(x.post_id))likesBy.set(x.post_id,[]);likesBy.get(x.post_id).push(x);});
      comments.forEach(x=>{if(!commentsBy.has(x.post_id))commentsBy.set(x.post_id,[]);commentsBy.get(x.post_id).push(x);});
      const frag=document.createDocumentFragment();
      posts.forEach(p=>{
        const normalized=Object.assign({},p,{profiles:byAuthor.get(p.author_id)||{}});
        try{frag.appendChild(window.renderPost(normalized,likesBy.get(p.id)||[],commentsBy.get(p.id)||[]));}catch(e){console.error('Mada render post:',e);}
      });
      if(frag.childNodes.length)feed.replaceChildren(frag);
      else throw new Error('render_failed');
      window.__madaFeedUser=currentUser;
    }catch(e){
      console.error('Mada feed hard fix:',e);
      feed.innerHTML='<div class="card empty">تعذر تحميل المنشورات الآن.<br><small>سيتم المحاولة مرة أخرى تلقائيًا.</small></div>';
      setTimeout(()=>load(),3000);
    }
  }
  function install(){
    window.loadFeed=load;
    setTimeout(load,500);
    setTimeout(load,2500);
    setTimeout(load,6000);
    window.addEventListener('pageshow',()=>setTimeout(load,300));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
