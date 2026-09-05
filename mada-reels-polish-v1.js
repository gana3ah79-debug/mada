/* Mada Reels Polish v1 — smoother UI, play feedback, double-tap polish */
(function(){'use strict';
function css(){if(document.getElementById('mrp-style'))return;const s=document.createElement('style');s.id='mrp-style';s.textContent=`
.mada-reels-v3 .mr-reel{isolation:isolate}
.mada-reels-v3 .mr-play{transition:transform .18s ease,opacity .18s ease,background .18s ease;will-change:transform}
.mada-reels-v3 .mr-play:active{transform:translate(-50%,-50%) scale(.9)}
.mada-reels-v3 .mr-reel .mr-actions button{transition:transform .16s ease,opacity .16s ease;will-change:transform}
.mada-reels-v3 .mr-reel .mr-actions button:active{transform:scale(.9)}
.mada-reels-v3 .mri-double-heart{animation:mrpHeartGlow .65s ease both}
@keyframes mrpHeartGlow{0%{filter:blur(1px);opacity:0}18%{filter:blur(0);opacity:1}75%{opacity:1}100%{opacity:0}}
.mada-reels-v3 .mr-info,.mada-reels-v3 .mr-actions{contain:layout paint}
@media(prefers-reduced-motion:reduce){.mada-reels-v3 *{animation:none!important;transition:none!important}}
` ;document.head.appendChild(s)}
function enhance(){const root=document.querySelector('.mada-reels-v3');if(!root)return;root.querySelectorAll('.mr-reel').forEach(card=>{if(card.dataset.mrp)return;card.dataset.mrp='1';const v=card.querySelector('video');if(!v)return;v.addEventListener('waiting',()=>card.classList.add('mrp-buffering'));v.addEventListener('playing',()=>card.classList.remove('mrp-buffering'));v.addEventListener('ended',()=>{if(v.loop)v.currentTime=0});});}
function boot(){css();enhance();new MutationObserver(enhance).observe(document.documentElement,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();