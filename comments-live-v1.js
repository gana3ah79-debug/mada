/* Mada comments live v2 — realtime like synchronization, auth-safe and DOM-safe. */
(function(){'use strict';
  let client=null,channel=null,postId=null,started=false,refreshTimer=null;
  function getClient(){return window.MADA_SUPABASE_CLIENT||window.sb||null}
  function buttons(id){try{return document.querySelectorAll('[data-like-comment="'+CSS.escape(id)+'"]')}catch(e){return[]}}
  async function refreshLike(id){
    if(!client||!id)return;
    const r=await client.from('comment_likes').select('user_id').eq('comment_id',id);
    if(r.error)return;
    const rows=r.data||[],count=rows.length,uid=window.__madaCommentUserId||null,liked=!!uid&&rows.some(x=>x.user_id===uid);
    buttons(id).forEach(b=>{
      const s=b.querySelector('span');
      b.classList.toggle('active',liked);
      b.setAttribute('aria-pressed',liked?'true':'false');
      if(s)s.textContent=count;
      const first=[...b.childNodes].find(n=>n.nodeType===3);
      if(first)first.nodeValue=(liked?'👍':'♡')+' ';
    });
  }
  function refreshVisible(){document.querySelectorAll('[data-like-comment]').forEach(b=>refreshLike(b.dataset.likeComment))}
  function schedule(id){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>refreshLike(id),100)}
  async function start(){
    if(started||!location.pathname.endsWith('comments.html'))return;
    postId=new URLSearchParams(location.search).get('post');client=getClient();
    if(!client||!postId)return;
    started=true;
    try{
      const s=await client.auth.getSession();
      window.__madaCommentUserId=s.data?.session?.user?.id||null;
    }catch(e){window.__madaCommentUserId=null}
    refreshVisible();
    client.auth.onAuthStateChange((_event,session)=>{
      window.__madaCommentUserId=session?.user?.id||null;
      refreshVisible();
    });
    channel=client.channel('mada-comments-likes-'+postId+'-'+Math.random().toString(36).slice(2,8))
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'comment_likes'},p=>{
        const id=p.new?.comment_id;if(id&&buttons(id).length)schedule(id);
      })
      .on('postgres_changes',{event:'DELETE',schema:'public',table:'comment_likes'},p=>{
        const id=p.old?.comment_id;if(id&&buttons(id).length)schedule(id);
      })
      .subscribe();
    const list=document.getElementById('commentsList');
    if(list)new MutationObserver(m=>{for(const x of m)if(x.addedNodes.length){refreshVisible();break}}).observe(list,{childList:true,subtree:true});
    window.addEventListener('pagehide',()=>{try{channel&&client.removeChannel(channel)}catch(e){}},{once:true});
  }
  function boot(){setTimeout(start,0)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();