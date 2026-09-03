/* Mada share button recovery — keeps مشاركة visible on every feed post and delegates to the canonical share modal. */
(function(){
  function add(){
    document.querySelectorAll('#feed article.post').forEach(function(post){
      const id=post.dataset.postId;
      const actions=post.querySelector('.post-actions');
      if(!id||!actions)return;
      let btn=actions.querySelector('.share[data-id]');
      if(!btn){
        btn=document.createElement('button');
        btn.type='button';
        btn.className='share';
        btn.dataset.id=id;
        btn.textContent='↗️ مشاركة';
        actions.appendChild(btn);
      }
      btn.dataset.id=id;
      btn.setAttribute('aria-label','مشاركة المنشور');
      btn.style.removeProperty('display');
      btn.style.removeProperty('visibility');
      btn.style.removeProperty('opacity');
    });
  }
  function click(e){
    const btn=e.target.closest('#feed .post-actions .share');
    if(!btn)return;
    e.preventDefault();
    e.stopPropagation();
    if(typeof window.openShareModal==='function')window.openShareModal(btn.dataset.id);
    else if(typeof window.sharePost==='function')window.sharePost(btn.dataset.id);
  }
  document.addEventListener('click',click,true);
  function init(){
    add();
    const feed=document.getElementById('feed');
    if(feed)new MutationObserver(add).observe(feed,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.madaShareButtonFix={refresh:add};
})();
