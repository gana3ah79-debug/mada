/* Mada comments routing v1 — comments live on a dedicated page, never expand inside feed. */
(function(){
  'use strict';
  if(window.__MADA_COMMENTS_ROUTING_V1)return;window.__MADA_COMMENTS_ROUTING_V1=true;
  function postId(el){return el?.closest?.('article.post')?.id?.replace(/^post-/,'')||el?.dataset?.postId||null}
  function open(id){if(!id)return;sessionStorage.setItem('mada-comments-return',location.href);location.href='comments.html?post='+encodeURIComponent(id)}
  function stop(e){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation()}
  document.addEventListener('click',function(e){
    const trigger=e.target.closest?.('[data-comment-toggle],[data-comments-open]');
    if(!trigger)return;const id=postId(trigger);if(!id)return;stop(e);open(id);
  },true);
  document.addEventListener('keydown',function(e){
    if(e.key!=='Enter'&&e.key!==' ')return;
    const trigger=e.target.closest?.('[data-comment-toggle],[data-comments-open]');
    if(!trigger)return;const id=postId(trigger);if(!id)return;stop(e);open(id);
  },true);
  const style=document.createElement('style');style.id='mada-comments-routing-v1-style';style.textContent='.feed article.post .comments{display:none!important;max-height:0!important;overflow:hidden!important;height:0!important;margin:0!important;padding:0!important;visibility:hidden!important}.feed article.post .comment-box{display:none!important}';document.head.appendChild(style);
})();
