/* Mada post actions layout: counts stay beside their action buttons. */
(function(){
  const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  async function refreshPost(article){
    const id=article?.id?.startsWith('post-')?article.id.slice(5):null;
    if(!id)return;
    const likeBtn=article.querySelector('.post-actions .like');
    const shareBtn=article.querySelector('.post-actions .share');
    if(!likeBtn||!shareBtn)return;
    const s=sb(); if(!s)return;
    const [likes,shares]=await Promise.all([
      s.from('post_likes').select('post_id,user_id,reaction_type').eq('post_id',id),
      s.from('post_shares').select('post_id',{count:'exact',head:true}).eq('post_id',id)
    ]);
    const rows=likes.data||[];
    const mine=window.user?rows.find(x=>x.user_id===window.user.id):null;
    const label=mine?(window.MadaReactions?.REACTIONS?.[mine.reaction_type||'like']?.label||'إعجاب'):'أعجبني';
    const emoji=mine?(window.MadaReactions?.REACTIONS?.[mine.reaction_type||'like']?.emoji||'👍'):'👍';
    likeBtn.innerHTML=`<span class="action-icon">${emoji}</span><span>${esc(label)}</span><b class="action-count">${rows.length}</b>`;
    likeBtn.dataset.liked=mine?'true':'false';
    likeBtn.classList.toggle('liked',!!mine);
    shareBtn.innerHTML=`<span class="action-icon">↗️</span><span>مشاركة</span><b class="action-count">${shares.count||0}</b>`;
    article.querySelector('.post-meta')?.remove();
  }
  function scan(){document.querySelectorAll('#feed article.post').forEach(a=>{refreshPost(a);});}
  const obs=new MutationObserver(()=>{clearTimeout(window.__madaPostLayoutTimer);window.__madaPostLayoutTimer=setTimeout(scan,80)});
  function boot(){const feed=document.getElementById('feed');if(!feed)return;obs.observe(feed,{childList:true,subtree:true});scan();setInterval(scan,10000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.MadaPostLayout={refresh:refreshPost,scan};
})();
