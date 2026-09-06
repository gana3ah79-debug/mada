/* Mada Post Cards v1 — small progressive enhancement, behavior untouched. */
(function(){'use strict';
if(window.__MADA_POST_CARDS_V1)return;window.__MADA_POST_CARDS_V1=true;
function mark(root){(root||document).querySelectorAll?.('#feed .post').forEach((post,i)=>{if(post.dataset.madaCardReady==='1')return;post.dataset.madaCardReady='1';post.style.animationDelay=Math.min(i*35,210)+'ms';post.classList.add('mada-card-ready');});}
function boot(){const feed=document.getElementById('feed');if(!feed)return;mark(feed);new MutationObserver(m=>{if(m.some(x=>x.addedNodes.length))requestAnimationFrame(()=>mark(feed))}).observe(feed,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
