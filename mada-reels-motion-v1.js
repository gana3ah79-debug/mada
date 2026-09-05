/* Mada Reels Stage 7 — modern motion: double tap heart, smooth transitions, side action entrance, quiet view counter */
(function(){'use strict';
 const state={root:null,observer:null,tap:0,timer:0,started:false};
 const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb, me=()=>window.madaUser?.()||window.user;
 function css(){if(document.getElementById('mrm7-style'))return;const s=document.createElement('style');s.id='mrm7-style';s.textContent=`
 .mada-reels-v3{scroll-behavior:smooth}
 .mada-reels-v3 .mr-reel{transition:opacity .22s ease,transform .28s cubic-bezier(.2,.8,.2,1);will-change:transform,opacity}
 .mada-reels-v3 .mr-reel.mrm7-active{transform:scale(1);opacity:1}
 .mada-reels-v3 .mr-reel:not(.mrm7-active){transform:scale(.985);opacity:.92}
 .mada-reels-v3 .mrm7-heart{position:absolute;z-index:20;left:50%;top:50%;pointer-events:none;font-size:92px;line-height:1;transform:translate(-50%,-50%) scale(.35) rotate(-8deg);opacity:0;text-shadow:0 8px 28px rgba(0,0,0,.45);animation:mrm7Heart .72s cubic-bezier(.18,.8,.25,1) both}
 @keyframes mrm7Heart{0%{opacity:0;transform:translate(-50%,-50%) scale(.25) rotate(-12deg)}18%{opacity:1;transform:translate(-50%,-50%) scale(1.18) rotate(4deg)}55%{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(0)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.3) rotate(5deg)}}
 .mada-reels-v3 .mr-actions{animation:mrm7Actions .45s ease-out both;transform-origin:left center}
 @keyframes mrm7Actions{from{opacity:0;transform:translateX(-12px) scale(.94)}to{opacity:1;transform:translateX(0) scale(1)}}
 .mada-reels-v3 .mrm7-views{position:absolute;z-index:4;top:14px;left:14px;padding:5px 9px;border-radius:999px;background:rgba(0,0,0,.28);color:rgba(255,255,255,.82);font:600 11px/1 sans-serif;backdrop-filter:blur(5px);pointer-events:none;opacity:.75}
 @media(prefers-reduced-motion:reduce){.mada-reels-v3 .mr-reel,.mada-reels-v3 .mr-actions{animation:none!important;transition:none!important}.mada-reels-v3 .mrm7-heart{animation:none!important}}
 `;document.head.appendChild(s)}
 function like(card){const b=card?.querySelector('[data-reel-like]');if(!b)return;const was=b.classList.contains('liked');if(!was)b.click()}
 function heart(card){const old=card.querySelector('.mrm7-heart');old?.remove();const h=document.createElement('div');h.className='mrm7-heart';h.textContent='❤️';card.appendChild(h);setTimeout(()=>h.remove(),760)}
 function bind(card){if(card.dataset.mrm7)return;card.dataset.mrm7='1';let last=0;
  card.addEventListener('pointerup',e=>{if(e.target.closest('button,a,input,textarea,select'))return;const now=Date.now();if(now-last<330){like(card);heart(card);last=0}else last=now;},{passive:true});
  card.addEventListener('touchend',e=>{if(e.target.closest('button,a,input,textarea,select'))return;const now=Date.now();if(now-last<330){e.preventDefault();like(card);heart(card);last=0}else last=now;},{passive:false});
 }
 function views(){const root=state.root;if(!root)return;root.querySelectorAll('.mr-reel').forEach(c=>{if(!c.querySelector('.mrm7-views')){const v=document.createElement('div');v.className='mrm7-views';v.textContent='👁 مشاهدة';c.appendChild(v)}})}
 function observe(){const root=document.querySelector('.mada-reels-v3');if(!root||root===state.root){if(root)views();return}state.root=root;root.querySelectorAll('.mr-reel').forEach(bind);views();state.observer?.disconnect();state.observer=new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('mrm7-active',e.isIntersecting&&e.intersectionRatio>.5)),{root,threshold:[.5,.8]});root.querySelectorAll('.mr-reel').forEach(c=>state.observer.observe(c))}
 function boot(){if(state.started)return;state.started=true;css();observe();new MutationObserver(()=>{clearTimeout(state.timer);state.timer=setTimeout(observe,80)}).observe(document.documentElement,{childList:true,subtree:true})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
 window.MadaReelsMotion={refresh:observe};
})();