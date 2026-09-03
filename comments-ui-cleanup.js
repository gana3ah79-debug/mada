/* Mada Home comments cleanup: remove the old inline comment input and send button. */
(function(){
  const STYLE_ID='mada-comments-cleanup-style';
  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;
    s.textContent='#feed article.post .comment-box{display:none!important}#feed article.post .comments:has(.comment-list:empty){display:none!important}';
    document.head.appendChild(s);
  }
  function clean(){
    document.querySelectorAll('#feed article.post .comment-box').forEach(el=>el.remove());
  }
  function init(){
    installStyle();clean();
    const feed=document.getElementById('feed');
    if(feed&&!feed.dataset.madaCommentCleanup){
      const obs=new MutationObserver(clean);obs.observe(feed,{childList:true,subtree:true});
      feed.dataset.madaCommentCleanup='1';
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.madaCleanLegacyCommentComposer=clean;
})();
