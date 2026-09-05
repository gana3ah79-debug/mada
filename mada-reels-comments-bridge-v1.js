/* Mada Reels Comments Bridge v1 — use the main comments system for reels */
(function(){'use strict';if(window.__MADA_REELS_COMMENTS_BRIDGE_V1)return;window.__MADA_REELS_COMMENTS_BRIDGE_V1=true;
function boot(){document.addEventListener('click',function(e){const b=e.target.closest('[data-mrf-comment],[data-reel-comment]');if(!b)return;const id=b.dataset.mrfComment||b.dataset.reelComment;if(!id)return;e.preventDefault();e.stopImmediatePropagation();if(window.MadaComments?.open)window.MadaComments.open(id);},true);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();