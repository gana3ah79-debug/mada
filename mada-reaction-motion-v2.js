/* Mada Reaction Motion v2 — interaction polish, persistence remains in existing reaction handlers. */
(function(){'use strict';
if(window.__MADA_REACTION_MOTION_V2)return;window.__MADA_REACTION_MOTION_V2=true;
function pulse(btn,cls){if(!btn)return;btn.classList.remove(cls);void btn.offsetWidth;btn.classList.add(cls);setTimeout(()=>btn.classList.remove(cls),650)}
function bind(){const feed=document.querySelector('#feed');if(!feed||feed.dataset.madaReactionMotionBound)return;feed.dataset.madaReactionMotionBound='1';feed.addEventListener('click',e=>{const btn=e.target.closest('.post-actions button');if(!btn)return;if(btn.classList.contains('like'))pulse(btn,'mada-reaction-pop');else pulse(btn,'mada-action-pulse')});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,300),{once:true});else setTimeout(bind,300);
new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
})();
