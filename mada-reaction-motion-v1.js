/* Mada Reaction Motion v1 — interaction polish, keeps existing persistence intact. */
(function(){'use strict';
if(window.__MADA_REACTION_MOTION_V1)return;window.__MADA_REACTION_MOTION_V1=true;
function pulse(btn){if(!btn)return;btn.classList.remove('mada-action-pulse','mada-reaction-pop');void btn.offsetWidth;btn.classList.add('mada-action-pulse');setTimeout(()=>btn.classList.remove('mada-action-pulse'),340)}
function likeMotion(btn){if(!btn)return;btn.classList.remove('mada-reaction-pop');void btn.offsetWidth;btn.classList.add('mada-reaction-pop');setTimeout(()=>btn.classList.remove('mada-reaction-pop'),650)}
function bind(){const feed=document.querySelector('#feed');if(!feed||feed.dataset.madaReactionMotionBound)return;feed.dataset.madaReactionMotionBound='1';feed.addEventListener('click',e=>{const btn=e.target.closest('.post-actions button');if(!btn)return;if(btn.classList.contains('like'))likeMotion(btn);else pulse(btn)});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,300),{once:true});else setTimeout(bind,300);
new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
})();
