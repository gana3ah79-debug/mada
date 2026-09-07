/* Mada comments live v3 — batched like synchronization, auth-safe and low-request. */
(function(){'use strict';
  let client=null,channel=null,postId=null,started=false,refreshTimer=null,observer=null;
  function getClient(){return window.MADA_SUPABASE_CLIENT||window.sb||null}
  function escId(id){try{return CSS.escape(id)}catch(e){return String(id).replace(/[^a-zA-Z0-9_-]/g,'\\$&')}}
  function buttons(id){return document.querySelectorAll('[data-like-comment="'+escId(id)+'"]')}
  function allButtons(){return [...document.querySelectorAll('[data-like-comment]')].filter(b=>b.dataset.likeComment)}
  async function refreshVisible(){
    if(!client)return;
    const bs=allButtons(),ids=[...new Set(bs.map(b=>b.dataset.likeComment).filter(Boolean))];
    if(!ids.length)return;
    const r=await client.from('comment_likes').select('comment_id,user_id').in('comment_id',ids);
    if(r.error)return;
    const counts=new Map(),mine=new Set(),uid=window.__madaCommentUserId||null;
    for(const x of r.data||[]){counts.set(x.comment_id,(counts.get(x.comment_id)||0)+1);if(uid&&x.user_id===uid)mine.add(x.comment_id)}
    bs.forEach(b=>{const id=b.dataset.likeComment,liked=mine.has(id),s=b.querySelector('span');b.classList.toggle('active',liked);b.setAttribute('aria-pressed',liked?'true':'false');if(s)s.textContent=counts.get(id)||0;const first=[...b.childNodes].find(n=>n.nodeType===3);if(first)first.nodeValue=(liked?'👍':'♡')+' '})
  }
  function schedule(){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>refreshVisible(),120)}
  async function start(){
    if(started||!location.pathname.endsWith('comments.html'))return;
    postId=new URLSearchParams(location.search).get('post');client=getClient();
    if(!client||!postId)return;started=true;
    try{const s=await client.auth.getSession();window.__madaCommentUserId=s.data?.session?.user?.id||null}catch(e){window.__madaCommentUserId=null}
    schedule();
    client.auth.onAuthStateChange((_event,session)=>{window.__madaCommentUserId=session?.user?.id||null;schedule()});
    channel=client.channel('mada-comments-likes-'+postId+'-'+Math.random().toString(36).slice(2,8))
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'comment_likes'},p=>{if(p.new?.comment_id) schedule()})
      .on('postgres_changes',{event:'DELETE',schema:'public',table:'comment_likes'},p=>{if(p.old?.comment_id) schedule()})
      .subscribe();
    const list=document.getElementById('commentsList');
    if(list){observer=new MutationObserver(m=>{for(const x of m)if(x.addedNodes.length){schedule();break}});observer.observe(list,{childList:true,subtree:true})}
    window.addEventListener('pagehide',()=>{try{observer?.disconnect();channel&&client.removeChannel(channel)}catch(e){}},{once:true});
  }
  function boot(){setTimeout(start,0)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();