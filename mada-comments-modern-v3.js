/* Mada comments modern v4 — dedicated comments page only. */
(function(){
  'use strict';
  if(window.__MADA_COMMENTS_MODERN_V4)return;
  window.__MADA_COMMENTS_MODERN_V4=true;
  const getId=el=>el?.closest?.('article.post')?.id?.replace(/^post-/,'')||el?.dataset?.postId||null;
  const open=id=>{if(!id)return;sessionStorage.setItem('mada-comments-return',location.href);location.href='comments.html?post='+encodeURIComponent(id)};
  function bind(){
    const feed=document.getElementById('feed');
    if(!feed||feed.dataset.madaCommentsPageBound)return;
    feed.dataset.madaCommentsPageBound='1';
    const route=e=>{
      const b=e.target.closest?.('[data-comment-toggle],[data-comments-open]');
      if(!b)return;
      const id=getId(b);
      if(!id)return;
      e.preventDefault();e.stopPropagation();
      if(e.stopImmediatePropagation)e.stopImmediatePropagation();
      open(id);
    };
    feed.addEventListener('click',route,true);
    feed.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;route(e)},true);
    const s=document.createElement('style');
    s.id='mada-comments-modern-v4-style';
    s.textContent='.feed .comments,.feed .comment-box{display:none!important;height:0!important;max-height:0!important;overflow:hidden!important;visibility:hidden!important;margin:0!important;padding:0!important}';
    document.head.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
  window.MadaCommentsModern={open};
})();