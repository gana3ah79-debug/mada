/* Mada Reels Stage 6 — performance: visible-only playback, smart next preload, listener guards, memory cleanup, low-end tuning */
(function(){'use strict';
 const state={observer:null,root:null,started:false,timer:0};
 const lowEnd=()=>{const c=navigator.hardwareConcurrency||4,d=navigator.deviceMemory||4,save=!!navigator.connection?.saveData;return save||c<=4||d<=2};
 const videoOf=c=>c?.querySelector('video');
 const load=v=>{if(!v||v.src||!v.dataset.src)return false;v.preload=lowEnd()?'metadata':'auto';v.src=v.dataset.src;v.load();return true};
 const unload=v=>{if(!v)return;try{v.pause()}catch(_){} if(v.dataset.src){v.removeAttribute('src');v.load()} };
 function stopOthers(active){if(!state.root)return;state.root.querySelectorAll('.mr-reel video').forEach(v=>{if(v!==active){try{v.pause()}catch(_){}}})}
 function prepareNext(card){const next=card?.nextElementSibling;if(next?.classList.contains('mr-reel')){const v=videoOf(next);if(v)load(v)}}
 function activate(card){const v=videoOf(card),p=card?.querySelector('.mr-play');if(!v)return;load(v);stopOthers(v);const play=()=>v.play().then(()=>p?.classList.add('hidden')).catch(()=>p?.classList.remove('hidden'));play();prepareNext(card)}
 function cleanupFar(active){if(!state.root)return;const cards=[...state.root.querySelectorAll('.mr-reel')];const ai=cards.indexOf(active);cards.forEach((c,i)=>{const v=videoOf(c);if(!v)return;if(Math.abs(i-ai)>1)unload(v)})}
 function bindCard(card){if(card.dataset.mrp6)return;card.dataset.mrp6='1';const v=videoOf(card),p=card.querySelector('.mr-play');if(!v)return;
  const toggle=()=>{if(v.paused){load(v);stopOthers(v);v.play().then(()=>p?.classList.add('hidden')).catch(()=>{})}else{v.pause();p?.classList.remove('hidden')}};
  v.addEventListener('click',toggle,{passive:true});
  p?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggle()});
  v.addEventListener('ended',()=>{if(v.loop){v.currentTime=0;v.play().catch(()=>{})}});
 }
 function observe(){const root=document.querySelector('.mada-reels-v3');if(!root||state.root===root)return;if(state.observer)state.observer.disconnect();state.root=root;state.root.querySelectorAll('.mr-reel').forEach(bindCard);
  state.observer=new IntersectionObserver(entries=>{let best=null;entries.forEach(e=>{if(e.isIntersecting&&e.intersectionRatio>.65){if(!best||e.intersectionRatio>best.intersectionRatio)best=e}});if(best){const card=best.target;activate(card);cleanupFar(card)}else{state.root.querySelectorAll('.mr-reel video').forEach(v=>v.pause())}}, {root,threshold:[0,.65,.9],rootMargin:'0px'});
  root.querySelectorAll('.mr-reel').forEach(c=>state.observer.observe(c));
 }
 function boot(){if(state.started)return;state.started=true;observe();const mo=new MutationObserver(()=>{clearTimeout(state.timer);state.timer=setTimeout(observe,60)});mo.observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('visibilitychange',()=>{if(document.hidden)state.root?.querySelectorAll('video').forEach(v=>v.pause())},{passive:true});window.addEventListener('pagehide',()=>state.root?.querySelectorAll('video').forEach(unload),{passive:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
 window.MadaReelsPerformance={load,unload,refresh:observe};
})();