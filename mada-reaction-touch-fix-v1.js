/* Mada reaction touch fix v1: faster long-press and clean mobile touch handling. */
(function(){
  'use strict';
  const HOLD=260;
  let timer=null,armed=null,longPressed=false,moved=false;
  function likeTarget(t){return t&&t.closest?t.closest('.post-actions .like[data-id]'):null}
  function clear(){if(timer){clearTimeout(timer);timer=null}armed=null;moved=false}
  document.addEventListener('touchstart',function(e){
    const btn=likeTarget(e.target); if(!btn)return;
    clear(); armed=btn; longPressed=false; moved=false;
    timer=setTimeout(function(){
      if(!armed||moved)return;
      longPressed=true;
      armed.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,view:window}));
    },HOLD);
    e.stopImmediatePropagation();
  },true);
  document.addEventListener('touchmove',function(e){
    if(!armed)return;
    moved=true; clear();
    e.stopImmediatePropagation();
  },true);
  document.addEventListener('touchend',function(e){
    if(!armed)return;
    const wasLong=longPressed;
    clear();
    if(wasLong){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  document.addEventListener('touchcancel',clear,true);
  const style=document.createElement('style');
  style.textContent='.post-actions .like[data-id]{touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}.mada-reaction-picker{touch-action:manipulation!important}';
  document.head.appendChild(style);
})();
