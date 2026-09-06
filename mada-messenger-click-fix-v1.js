/* Mada Messenger click fix v4 — mobile pointer/touch capture */
(function(){'use strict';
if(window.__MADA_MESSENGER_CLICK_FIX_V4)return;window.__MADA_MESSENGER_CLICK_FIX_V4=true;
let locked=null,until=0;
function activate(ev){
 const b=ev.target&&ev.target.closest?ev.target.closest('.mada-ms-user'):null;
 const list=document.getElementById('madaMsList');
 if(!b||!list||!list.contains(b))return;
 const now=Date.now();
 if(locked===b&&now<until)return;
 locked=b;until=now+1000;
 ev.preventDefault();ev.stopImmediatePropagation();
 b.classList.add('active');
 const id=b.dataset.id,name=b.dataset.name||b.querySelector('b')?.textContent?.trim()||'مستخدم Mada';
 const go=()=>{if(window.MadaMessenger&&typeof window.MadaMessenger.openFriend==='function'){window.MadaMessenger.openFriend(id,name);return true}return false};
 if(!go())setTimeout(go,100);
 setTimeout(()=>{if(locked===b)locked=null},1100);
}
['pointerdown','pointerup','touchstart','touchend','click'].forEach(type=>document.addEventListener(type,activate,true));
})();