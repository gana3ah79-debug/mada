/* Mada Messenger click fix v3 — capture taps before any competing handlers */
(function(){'use strict';
if(window.__MADA_MESSENGER_CLICK_FIX_V3)return;window.__MADA_MESSENGER_CLICK_FIX_V3=true;
let locked=null,until=0;
function activate(ev){
  const b=ev.target&&ev.target.closest?ev.target.closest('.mada-ms-user'):null;
  if(!b||!document.getElementById('madaMsList')?.contains(b))return;
  const now=Date.now();
  if(locked===b&&now<until)return;
  locked=b;until=now+900;
  ev.preventDefault();ev.stopPropagation();
  b.classList.add('active');
  const id=b.dataset.id,name=b.dataset.name||b.querySelector('b')?.textContent?.trim()||'';
  if(typeof b.onclick==='function'){
    try{b.onclick.call(b,ev);return}catch(err){console.error('Mada Messenger click',err)}
  }
  if(window.MadaMessenger&&typeof window.MadaMessenger.openFriend==='function'){
    window.MadaMessenger.openFriend(id,name);
  }
}
['click','pointerup','touchend'].forEach(type=>document.addEventListener(type,activate,true));
})();