/* Mada Reels Stage 7 — smooth scrolling, playback stability and mobile UX */
(function(){'use strict';
 const S={root:null,observer:null,mo:null,bound:false,raf:0,last:null};
 const root=()=>document.querySelector('.mada-reels-v3');
 const card=v=>v?.closest?.('.mr-reel');
 function pauseAll(except){S.root?.querySelectorAll('video').forEach(v=>{if(v!==except&&!v.paused){try{v.pause()}catch(_){}}})}
 function tune(v){if(!v)return;v.setAttribute('playsinline','');v.playsInline=true;v.preload='metadata';v.disablePictureInPicture=true;}
 function activate(c){const v=c?.querySelector('video');if(!v)return;pauseAll(v);if(!v.src&&v.dataset.src){v.src=v.dataset.src;v.load()}v.play().catch(()=>{});S.last=c}
 function setupObserver(){const r=root();if(!r||S.root===r)return;if(S.observer)S.observer.disconnect();S.root=r;r.querySelectorAll('.mr-reel video').forEach(tune);S.observer=new IntersectionObserver(es=>{let best=null;for(const e of es){if(e.isIntersecting&&e.intersectionRatio>=.7&&(!best||e.intersectionRatio>best.intersectionRatio))best=e}if(best)activate(best.target);else pauseAll()}, {root:r,threshold:[.7,.9]});r.querySelectorAll('.mr-reel').forEach(c=>S.observer.observe(c));}
 function bindScroll(){const r=S.root;if(!r||S.bound)return;S.bound=true;r.addEventListener('scroll',()=>{if(S.raf)return;S.raf=requestAnimationFrame(()=>{S.raf=0;const cards=[...r.querySelectorAll('.mr-reel')];let best=null,bd=Infinity;const mid=r.scrollTop+r.clientHeight/2;cards.forEach(c=>{const d=Math.abs(c.offsetTop+c.offsetHeight/2-mid);if(d<bd){bd=d;best=c}});if(best&&best!==S.last&&bd<r.clientHeight*.6)activate(best)}, {passive:true});},{passive:true});}
 function optimize(){const r=root();if(!r)return;setupObserver();bindScroll();r.querySelectorAll('.mr-reel').forEach((c,i)=>{const v=c.querySelector('video');if(!v)return;v.dataset.stage7='1';if(i>1&&i<r.children.length-1&&v!==S.last?.querySelector('video')){if(v.dataset.src&&!v.src)v.preload='none';}})}
 function boot(){if(S.mo)return;optimize();S.mo=new MutationObserver(()=>{clearTimeout(S.timer);S.timer=setTimeout(optimize,80)});S.mo.observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseAll()},{passive:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
 window.MadaReelsStage7={refresh:optimize,pauseAll:()=>pauseAll()};
})();