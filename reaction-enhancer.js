/* Mada reaction UI enhancer: larger Facebook-style picker + reaction summary. */
(function(){
  const MAP={angry:'😡',sad:'😢',wow:'😮',haha:'😂',care:'🤗',love:'❤️',like:'👍'};
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  async function refreshSummaries(){
    if(!window.sb||!window.user)return;
    const posts=[...document.querySelectorAll('#feed article.post[id^="post-"]')].map(x=>x.id.slice(5)).filter(Boolean);
    if(!posts.length)return;
    const r=await sb.from('post_likes').select('post_id,user_id,reaction_type').in('post_id',posts);
    if(r.error)return;
    const grouped=new Map();
    for(const row of r.data||[]){if(!grouped.has(row.post_id))grouped.set(row.post_id,[]);grouped.get(row.post_id).push(row)}
    for(const id of posts){
      const article=document.getElementById('post-'+id), meta=article?.querySelector('.post-meta');
      const old=meta?.querySelector('[data-reaction-summary]');
      if(!meta||!old)continue;
      const rows=grouped.get(id)||[];
      const counts=new Map(); rows.forEach(x=>counts.set(x.reaction_type||'like',(counts.get(x.reaction_type||'like')||0)+1));
      const top=[...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3);
      const mine=rows.find(x=>x.user_id===user.id);
      old.innerHTML=(top.map(x=>`<span class="reaction-mini">${MAP[x[0]]||'👍'}</span>`).join('')||'<span class="reaction-mini muted-reaction">👍</span>')+`<b>${rows.length}</b>${mine?`<small> أنت</small>`:''}`;
      const btn=article.querySelector('.post-actions .like');
      if(btn){btn.classList.toggle('liked',!!mine);btn.innerHTML=mine?`${MAP[mine.reaction_type]||'👍'} ${esc(window.MadaReactions?.REACTIONS?.[mine.reaction_type]?.label||'تفاعل')}`:'👍 أعجبني';}
    }
  }
  function enhance(){
    document.querySelectorAll('#feed .post').forEach(article=>{
      const meta=article.querySelector('.post-meta'); if(!meta)return;
      const first=meta.firstElementChild;
      if(first&&!first.dataset.reactionSummary){first.dataset.reactionSummary='1';first.removeAttribute('data-reaction-summary');const holder=document.createElement('span');holder.dataset.reactionSummary='1';holder.className='reaction-summary';first.replaceWith(holder)}
    });
    refreshSummaries();
  }
  const obs=new MutationObserver(()=>{clearTimeout(window.__madaReactionTimer);window.__madaReactionTimer=setTimeout(enhance,80)});
  function boot(){const feed=document.getElementById('feed');if(feed)obs.observe(feed,{childList:true,subtree:true});enhance();setInterval(refreshSummaries,12000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();