/* Mada comments v6 — standalone comments routing. */
(function(){
  'use strict';
  if(window.__MADA_COMMENTS_V6)return;window.__MADA_COMMENTS_V6=true;
  const getId=el=>el?.closest?.('article.post')?.id?.replace(/^post-/,'')||el?.dataset?.postId||null;
  const open=id=>{if(!id)return;sessionStorage.setItem('mada-comments-return',location.href);location.href='comments.html?post='+encodeURIComponent(id)};
  function bind(){
    document.querySelectorAll('#feed article.post').forEach(article=>{
      if(article.dataset.madaCommentsRouteBound)return;
      article.dataset.madaCommentsRouteBound='1';
      article.querySelectorAll('[data-comment-toggle],[data-comments-open]').forEach(btn=>{
        btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open(getId(btn))},true);
      });
    });
  }
  const style=document.createElement('style');
  style.textContent='.feed article.post .comments{display:none!important;max-height:0!important;height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;visibility:hidden!important}.feed article.post .comment-box{display:none!important}';
  document.head.appendChild(style);
  function boot(){const feed=document.getElementById('feed');if(!feed)return;bind();new MutationObserver(bind).observe(feed,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
