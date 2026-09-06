/* Mada Reaction Motion v3 — stronger visible like feedback. Persistence remains in existing handlers. */
(function(){'use strict';
if(window.__MADA_REACTION_MOTION_V3)return;window.__MADA_REACTION_MOTION_V3=true;
function pulse(btn,cls){if(!btn)return;btn.classList.remove(cls);void btn.offsetWidth;btn.classList.add(cls);setTimeout(()=>btn.classList.remove(cls),700)}
function burst(btn){
  if(!btn)return;
  const r=btn.getBoundingClientRect();
  const wrap=document.createElement('span');
  wrap.className='mada-reaction-burst';
  wrap.setAttribute('aria-hidden','true');
  wrap.style.left=(r.left+r.width/2)+'px';
  wrap.style.top=(r.top+r.height/2+window.scrollY)+'px';
  wrap.innerHTML='<span class="mada-burst-heart">♥</span><i>✦</i><i>✦</i><i>✦</i><i>✦</i>';
  document.body.appendChild(wrap);
  setTimeout(()=>wrap.remove(),850);
}
function bind(){
  const feed=document.querySelector('#feed');
  if(!feed||feed.dataset.madaReactionMotionBound)return;
  feed.dataset.madaReactionMotionBound='1';
  feed.addEventListener('click',e=>{
    const btn=e.target.closest('.post-actions button');
    if(!btn)return;
    if(btn.classList.contains('like')){pulse(btn,'mada-reaction-pop');burst(btn)}
    else pulse(btn,'mada-action-pulse');
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,300),{once:true});else setTimeout(bind,300);
new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
})();
