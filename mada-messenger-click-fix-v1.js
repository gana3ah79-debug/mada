/* Mada Messenger click fix v1 — reliable mobile friend-row activation */
(function(){'use strict';
if(window.__MADA_MESSENGER_CLICK_FIX_V1)return;window.__MADA_MESSENGER_CLICK_FIX_V1=true;
function bind(root){
  const rows=root.querySelectorAll?.('.mada-ms-user')||[];
  rows.forEach(b=>{
    if(b.dataset.clickFix==='1')return;
    b.dataset.clickFix='1';
    b.style.pointerEvents='auto';
    b.style.touchAction='manipulation';
    const run=ev=>{
      ev.preventDefault();
      ev.stopPropagation();
      b.classList.add('active');
      const fn=b.onclick;
      if(typeof fn==='function'){
        try{fn.call(b,ev);}catch(err){console.error('Mada Messenger friend click',err);}
      }else{
        b.click();
      }
    };
    b.addEventListener('pointerup',run,{passive:false});
    b.addEventListener('touchend',run,{passive:false});
  });
}
function boot(){
  const start=()=>{const list=document.getElementById('madaMsList');if(list)bind(list)};
  start();
  new MutationObserver(start).observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();