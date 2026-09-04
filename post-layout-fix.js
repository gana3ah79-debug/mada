/* Mada post actions layout: stable, no jitter. */
(function(){
  const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  let running=false;
  let queued=false;

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
    const type=mine?.reaction_type||'like';
    const label=window.MadaReactions?.REACTIONS?.[type]?.label||'إعجاب';
    const emoji=window.MadaReactions?.REACTIONS?.[type]?.emoji||'👍';
    const likeCount=String(rows.length);
    const shareCount=String(shares.count||0);
    const nextLike=`${emoji}|${label}|${likeCount}`;
    const nextShare=`↗️|مشاركة|${shareCount}`;
    if(likeBtn.dataset.madaValue!==nextLike){
      likeBtn.innerHTML=`<span class="action-icon">${emoji}</span><span>${esc(label)}</span><b class="action-count">${likeCount}</b>`;
      likeBtn.dataset.madaValue=nextLike;
    }
    if(shareBtn.dataset.madaValue!==nextShare){
      shareBtn.innerHTML=`<span class="action-icon">↗️</span><span>مشاركة</span><b class="action-count">${shareCount}</b>`;
      shareBtn.dataset.madaValue=nextShare;
    }
    likeBtn.dataset.liked=mine?'true':'false';
    likeBtn.classList.toggle('liked',!!mine);
    article.querySelector('.post-meta')?.remove();
  }

  async function scan(){
    if(running){queued=true;return;}
    running=true;
    try{
      const articles=[...document.querySelectorAll('#feed article.post')];
      await Promise.all(articles.map(refreshPost));
    }finally{
      running=false;
      if(queued){queued=false;setTimeout(scan,120);}
    }
  }

  function boot(){
    const feed=document.getElementById('feed');
    if(!feed)return;
    let timer=0;
    const obs=new MutationObserver(()=>{
      clearTimeout(timer);
      timer=setTimeout(()=>{
        obs.disconnect();
        scan().finally(()=>obs.observe(feed,{childList:true,subtree:true}));
      },180);
    });
    obs.observe(feed,{childList:true,subtree:true});
    setTimeout(scan,300);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.MadaPostLayout={refresh:refreshPost,scan};
})();
