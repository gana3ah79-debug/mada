/* Mada comment modal v5 — legacy entry point now routes to the dedicated comments page. */
(function(){
  'use strict';
  if(window.__MADA_COMMENT_MODAL_V5)return;
  window.__MADA_COMMENT_MODAL_V5=true;
  function open(id){
    if(!id)return;
    sessionStorage.setItem('mada-comments-return',location.href);
    location.href='comments.html?post='+encodeURIComponent(id);
  }
  function bind(){
    const feed=document.getElementById('feed');
    if(!feed)return;
    feed.addEventListener('click',function(e){
      const b=e.target.closest?.('[data-comment-toggle],[data-comments-open]');
      if(!b)return;
      const post=b.closest('article.post');
      const id=post?.id?.replace(/^post-/,'')||b.dataset.postId;
      if(!id)return;
      e.preventDefault();e.stopPropagation();
      if(e.stopImmediatePropagation)e.stopImmediatePropagation();
      open(id);
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
  window.MadaCommentModalV4={open,close:function(){}};
})();