/* Mada post actions layout: stable, compact and Facebook-style. */
(function(){
  const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  let running=false;
  let queued=false;

  function ensureStyles(){
    if(document.getElementById('mada-phase1-post-style'))return;
    const s=document.createElement('style');
    s.id='mada-phase1-post-style';
    s.textContent=`
      #feed article.post{padding:14px 14px 8px!important;margin:8px 0!important;border-radius:18px!important;overflow:hidden}
      #feed article.post .post-head{min-height:46px!important;margin-bottom:10px!important}
      #feed article.post .post-head .avatar{width:42px!important;height:42px!important;flex:0 0 42px!important}
      #feed article.post .post-text{font-size:16px!important;line-height:1.75!important;margin:4px 2px 10px!important;white-space:pre-wrap;overflow-wrap:anywhere}
      #feed article.post .post-image{display:block;width:calc(100% + 28px)!important;max-width:none!important;margin:8px -14px 10px!important;max-height:520px!important;object-fit:cover!important;border-radius:0!important}
      #feed article.post .mada-post-stats{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:34px;padding:4px 2px 7px;color:#64748b;font-size:12px;border-bottom:1px solid rgba(148,163,184,.22)}
      #feed article.post .mada-reaction-summary{display:flex;align-items:center;gap:1px;direction:ltr;white-space:nowrap}
      #feed article.post .mada-reaction-summary i{font-style:normal;font-size:15px;line-height:1;margin-left:-2px}
      #feed article.post .mada-counts{display:flex;align-items:center;gap:10px;direction:rtl;white-space:nowrap}
      #feed article.post .mada-counts span{display:inline-flex;align-items:center;gap:3px}
      #feed article.post .post-actions{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:4px!important;padding-top:5px!important;margin-top:0!important}
      #feed article.post .post-actions button{min-width:0!important;min-height:40px!important;border:0!important;border-radius:10px!important;background:transparent!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;font-size:13px!important;white-space:nowrap!important;box-shadow:none!important;transform:none!important}
      #feed article.post .post-actions button:active{transform:scale(.98)!important}
      #feed article.post .post-actions .action-icon{width:22px!important;height:22px!important;display:inline-grid!important;place-items:center!important;font-size:18px!important;filter:none!important}
      #feed article.post .post-actions .action-count{font-size:11px!important;font-weight:800!important;color:#64748b!important}
      #feed article.post .post-actions .liked{font-weight:800!important}
      @media(max-width:600px){
        #feed article.post{padding:12px 12px 7px!important;margin:7px 0!important;border-radius:16px!important}
        #feed article.post .post-image{width:calc(100% + 24px)!important;margin-left:-12px!important;margin-right:-12px!important;max-height:460px!important}
        #feed article.post .mada-counts{gap:7px}
        #feed article.post .post-actions button{min-height:38px!important;font-size:12px!important}
      }
      body.dark #feed article.post .mada-post-stats{border-color:rgba(148,163,184,.18);color:#94a3b8}
      body.dark #feed article.post .post-actions button{color:#dbeafe!important}
    `;
    document.head.appendChild(s);
  }

  async function refreshPost(article){
    const id=article?.id?.startsWith('post-')?article.id.slice(5):null;
    if(!id)return;
    const likeBtn=article.querySelector('.post-actions .like');
    const shareBtn=article.querySelector('.post-actions .share');
    const commentBtn=article.querySelector('.post-actions .comment-toggle');
    if(!likeBtn||!shareBtn)return;
    const s=sb(); if(!s)return;
    const [likes,shares,comments]=await Promise.all([
      s.from('post_likes').select('post_id,user_id,reaction_type').eq('post_id',id),
      s.from('post_shares').select('post_id',{count:'exact',head:true}).eq('post_id',id),
      s.from('comments').select('id',{count:'exact',head:true}).eq('post_id',id)
    ]);
    const rows=likes.data||[];
    const mine=window.user?rows.find(x=>x.user_id===window.user.id):null;
    const type=mine?.reaction_type||'like';
    const label=window.MadaReactions?.REACTIONS?.[type]?.label||'إعجاب';
    const emoji=window.MadaReactions?.REACTIONS?.[type]?.emoji||'👍';
    const likeCount=rows.length;
    const commentCount=comments.count||0;
    const shareCount=shares.count||0;

    const reactionOrder=['love','like','care','haha','wow','sad','angry'];
    const reactionEmojis=[];
    for(const key of reactionOrder){
      if(rows.some(x=>(x.reaction_type||'like')===key))reactionEmojis.push(window.MadaReactions?.REACTIONS?.[key]?.emoji||({love:'❤️',like:'👍',care:'🥰',haha:'😂',wow:'😮',sad:'😢',angry:'😡'}[key]));
    }
    if(!reactionEmojis.length&&likeCount)reactionEmojis.push('👍');

    let stats=article.querySelector('.mada-post-stats');
    if(!stats){
      stats=document.createElement('div');
      stats.className='mada-post-stats';
      const actions=article.querySelector('.post-actions');
      if(actions)actions.before(stats);
    }
    stats.innerHTML=`<div class="mada-reaction-summary" aria-label="التفاعلات">${reactionEmojis.slice(0,3).map(x=>`<i>${x}</i>`).join('')}</div><div class="mada-counts"><span>👍 ${likeCount}</span><span>💬 ${commentCount}</span><span>↗️ ${shareCount}</span></div>`;

    const nextLike=`${emoji}|${label}|${likeCount}`;
    const nextShare=`↗️|مشاركة|${shareCount}`;
    const nextComment=`💬|تعليق|${commentCount}`;
    if(likeBtn.dataset.madaValue!==nextLike){
      likeBtn.innerHTML=`<span class="action-icon">${emoji}</span><span>${esc(label)}</span><b class="action-count">${likeCount}</b>`;
      likeBtn.dataset.madaValue=nextLike;
    }
    if(shareBtn.dataset.madaValue!==nextShare){
      shareBtn.innerHTML=`<span class="action-icon">↗️</span><span>مشاركة</span><b class="action-count">${shareCount}</b>`;
      shareBtn.dataset.madaValue=nextShare;
    }
    if(commentBtn&&commentBtn.dataset.madaValue!==nextComment){
      commentBtn.innerHTML=`<span class="action-icon">💬</span><span>تعليق</span><b class="action-count">${commentCount}</b>`;
      commentBtn.dataset.madaValue=nextComment;
    }
    likeBtn.dataset.liked=mine?'true':'false';
    likeBtn.classList.toggle('liked',!!mine);
    article.querySelector('.post-meta')?.remove();
  }

  async function scan(){
    if(running){queued=true;return;}
    running=true;
    try{
      ensureStyles();
      const articles=[...document.querySelectorAll('#feed article.post')];
      await Promise.all(articles.map(refreshPost));
    }finally{
      running=false;
      if(queued){queued=false;setTimeout(scan,120);}
    }
  }

  function boot(){
    ensureStyles();
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
