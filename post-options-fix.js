/* Mada — robust three-dots menu fix for Home feed */
(function(){
  function findPost(el){ return el?.closest?.('.post, .profile-post'); }
  function ensureButton(card){
    if(!card) return;
    const id=card.dataset.postId;
    if(!id || card.querySelector('.three-dots-btn')) return;
    const head=card.querySelector('.post-head, .profile-post-head');
    if(!head) return;
    let owner=card.dataset.authorId||'';
    try{ owner=owner || window.feedPosts?.get?.(id)?.author_id || ''; }catch(e){}
    card.dataset.authorId=owner;
    const b=document.createElement('button');
    b.type='button'; b.className='three-dots-btn';
    b.setAttribute('aria-label','المزيد من خيارات المنشور');
    b.setAttribute('title','خيارات المنشور');
    b.textContent='⋮';
    b.addEventListener('click',function(e){
      e.preventDefault(); e.stopPropagation();
      if(typeof window.openPostOptions==='function') window.openPostOptions(id, owner);
    });
    head.appendChild(b);
  }
  function scan(root=document){ root.querySelectorAll?.('.post, .profile-post').forEach(ensureButton); }
  function init(){
    scan();
    const obs=new MutationObserver(()=>scan());
    obs.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('click',function(e){
      const b=e.target.closest?.('.three-dots-btn');
      if(!b) return;
      e.preventDefault(); e.stopPropagation();
    },true);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
  window.madaInstallPostDots=scan;
})();
