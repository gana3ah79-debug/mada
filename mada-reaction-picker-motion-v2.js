/* Mada reaction picker v3 — fast touch + anchored mobile behavior */
(function(){'use strict';
if(window.__MADA_PICKER_MOTION_V3)return;window.__MADA_PICKER_MOTION_V3=true;
const HOLD=260;
const css=`.mada-reaction-picker{width:min(320px,calc(100vw - 20px))!important;max-width:calc(100vw - 20px)!important;touch-action:manipulation!important}.mada-reaction-picker .mada-reaction{width:48px!important;height:48px!important;flex:0 0 48px!important;font-size:30px!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent}.post-actions .like[data-id]{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}@media(max-width:520px){.mada-reaction-picker{width:min(320px,calc(100vw - 20px))!important}.mada-reaction-picker .mada-reaction{width:46px!important;height:46px!important;flex-basis:46px!important;font-size:29px!important}}`;
const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);
function emojiFrom(e){const t=e.target;return t&&t.closest?t.closest('.mada-reaction-picker .mada-reaction'):null}
function animate(b){if(!b)return;b.classList.remove('mada-rx-motion');void b.offsetWidth;b.classList.add('mada-rx-motion');setTimeout(()=>b.classList.remove('mada-rx-motion'),700)}
function likeFrom(e){const t=e.target;return t&&t.closest?t.closest('.post-actions .like[data-id]'):null}
let timer=null,pressed=null,long=false,moved=false;
function clear(){if(timer){clearTimeout(timer);timer=null}pressed=null;moved=false}
const root=document;
root.addEventListener('touchstart',e=>{
  const b=likeFrom(e);if(!b)return;
  clear();pressed=b;long=false;moved=false;
  timer=setTimeout(()=>{if(!pressed||moved)return;long=true;pressed.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,view:window}))},HOLD);
  e.stopImmediatePropagation();
},true);
root.addEventListener('touchmove',e=>{if(!pressed)return;moved=true;clear();e.stopImmediatePropagation()},true);
root.addEventListener('touchend',e=>{if(!pressed)return;const wasLong=long;clear();if(wasLong){e.preventDefault();e.stopImmediatePropagation()}},true);
root.addEventListener('touchcancel',clear,true);
root.addEventListener('pointerdown',e=>{const b=emojiFrom(e);if(b)animate(b)},true);
root.addEventListener('click',e=>{const b=emojiFrom(e);if(b){animate(b);setTimeout(()=>animate(b),70)}},true);
})();
