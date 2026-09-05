/* Mada reaction UI: counts belong beside the action buttons only. */
(function(){
  const MAP={angry:'😡',sad:'😢',wow:'😮',haha:'😂',love:'❤️',like:'👍'};
  const getSb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  const getUser=()=>window.user||null;
  async function refreshCounts(){
    const sb=getSb(),user=getUser(); if(!sb)return;
    const articles=[...document.querySelectorAll('#feed .post[id^="post-"]')]; if(!articles.length)return;
    const ids=articles.map(x=>x.id.slice(5)).filter(Boolean);
    const [lr,sr]=await Promise.all([
      sb.from('post_likes').select('post_id,user_id,reaction_type').in('post_id',ids),
      sb.from('post_shares').select('post_id').in('post_id',ids)
    ]);
    const likes=lr.data||[],shares=sr.data||[];
    for(const article of articles){
      const id=article.id.slice(5),ls=likes.filter(x=>x.post_id===id),sc=shares.filter(x=>x.post_id===id).length;
      const mine=user?ls.find(x=>x.user_id===user.id):null;
      const likeBtn=article.querySelector('.post-actions .like'),shareBtn=article.querySelector('.post-actions .share'),meta=article.querySelector('.post-meta');
      if(meta)meta.style.display='none';
      if(likeBtn){
        const icon=mine?(MAP[mine.reaction_type]||'👍'):'👍';
        const label=mine?(window.MadaReactions?.REACTIONS?.[mine.reaction_type]?.label||'تفاعل'):'إعجاب';
        likeBtn.innerHTML=`<span class="action-icon">${icon}</span><span>${label}</span> <b class="action-count">${ls.length}</b>`;
        likeBtn.dataset.liked=mine?'true':'false';
        if(mine)likeBtn.dataset.reactionType=mine.reaction_type;else delete likeBtn.dataset.reactionType;
      }
      if(shareBtn)shareBtn.innerHTML=`↗️ مشاركة <b class="action-count">${sc}</b>`;
    }
  }
  const obs=new MutationObserver(()=>{clearTimeout(window.__madaReactionTimer);window.__madaReactionTimer=setTimeout(refreshCounts,100)});
  function boot(){const feed=document.getElementById('feed');if(feed)obs.observe(feed,{childList:true,subtree:true});refreshCounts();setInterval(refreshCounts,12000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
