/* Mada Comments — navigation-only adapter. The old modal implementation is intentionally disabled. */
(function(){'use strict';
if(window.__MADA_COMMENTS_NAV_V2)return;window.__MADA_COMMENTS_NAV_V2=true;
function go(id){if(!id)return;try{sessionStorage.setItem('mada-comments-return',location.href)}catch(_){};location.href='comments.html?post='+encodeURIComponent(id)+'&v=20260908-2';}
function open(id){go(id)}
function boot(){document.addEventListener('click',function(e){const b=e.target.closest('[data-comments-open]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();go(b.dataset.commentsOpen)},true);window.MadaComments={open,refresh:function(){}}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();