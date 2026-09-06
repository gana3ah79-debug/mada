/* Mada Messenger click fix v5 — direct target dispatch */
(function(){'use strict';
if(window.__MADA_MESSENGER_CLICK_FIX_V5)return;window.__MADA_MESSENGER_CLICK_FIX_V5=true;
let locked=null,until=0;
function activate(ev){
 const b=ev.target&&ev.target.closest?ev.target.closest('.mada-ms-user'):null;
 const list=document.getElementById('madaMsList');
 if(!b||!list||!list.contains(b))return;
 const now=Date.now();
 if(locked===b&&now<until)return;
 locked=b;until=now+1200;
 ev.preventDefault();ev.stopImmediatePropagation();
 b.classList.add('active');
 const id=b.dataset.id,name=b.dataset.name||b.querySelector('b')?.textContent?.trim()||'مستخدم Mada';
 /* Dispatch a non-bubbling event directly on the friend button.
    This bypasses document-level capture handlers that were swallowing taps. */
 const direct=()=>{
   if(!document.getElementById('madaMsList')?.contains(b))return false;
   try{b.dispatchEvent(new MouseEvent('click',{bubbles:false,cancelable:true,view:window}));return true}catch(_){
     try{b.dispatchEvent(new Event('click',{bubbles:false,cancelable:true}));return true}catch(__){return false}
   }
 };
 if(!direct()){
   const go=()=>{if(window.MadaMessenger&&typeof window.MadaMessenger.openFriend==='function'){window.MadaMessenger.openFriend(id,name);return true}return false};
   go();setTimeout(go,120);
 }
 setTimeout(()=>{if(locked===b)locked=null},1250);
}
['pointerdown','touchstart','click'].forEach(type=>document.addEventListener(type,activate,true));
})();