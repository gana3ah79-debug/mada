/* Mada comments live v1 — realtime like synchronization. */
(function(){'use strict';
  let client=null,channel=null,postId=null,started=false,refreshTimer=null;
  const q=s=>document.querySelector(s);
  function getClient(){return window.MADA_SUPABASE_CLIENT||window.sb||null}
  async function refreshLike(id){
    if(!client||!id)return;
    const r=await client.from('comment_likes').select('user_id').eq('comment_id',id);
    if(r.error)return;
    const rows=r.data||[],count=rows.length,liked=!!window.__madaCommentUserId&&rows.some(x=>x.user_id===window.__madaCommentUserId);
    document.querySelectorAll('[data-like-comment="'+CSS.escape(id)+'"]').forEach(b=>{
      const s=b.querySelector('span');
      b.classList.toggle('active',liked);
      if(s)s.textContent=count;
      const first=[...b.childNodes].find(n=>n.nodeType===3);
      if(first)first.nodeValue=(liked?'👍':'♡')+' ';
    });
  }
  function schedule(id){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>refreshLike(id),80)}
  async function start(){
    if(started||!location.pathname.endsWith('comments.html'))return;
    postId=new URLSearchParams(location.search).get('post');client=getClient();
    if(!client||!postId)return;
    started=true;
    try{const s=await client.auth.getSession();window.__madaCommentUserId=s.data?.session?.user?.id||null}catch(e){}
    document.querySelectorAll('[data-like-comment]').forEach(b=>refreshLike(b.dataset.likeComment));
    channel=client.channel('mada-comments-likes-'+postId+'-'+Math.random().toString(36).slice(2,8))
      .on('postgres_changes',{event:'*',schema:'public',table:'comment_likes'},payload=>{
        const id=payload.new?.comment_id||payload.old?.comment_id;
        if(id&&document.querySelector('[data-like-comment="'+CSS.escape(id)+'"]'))schedule(id);
      }).subscribe();
    window.addEventListener('pagehide',()=>{try{channel&&client.removeChannel(channel)}catch(e){}} ,{once:true});
  }
  function boot(){setTimeout(start,0)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();