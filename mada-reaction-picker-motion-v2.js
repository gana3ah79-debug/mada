/* Mada reaction picker v2 — reliable touch animation */
(function(){'use strict';
if(window.__MADA_PICKER_MOTION_V2)return;window.__MADA_PICKER_MOTION_V2=true;
const css=`.mada-rx-motion{animation:madaRxBounce .42s cubic-bezier(.2,.9,.3,1.3)!important;will-change:transform}.mada-rx-motion span{animation:madaRxEmoji .42s ease-out!important}.mada-rx-motion:nth-child(2){animation-delay:.03s!important}.mada-rx-motion:nth-child(3){animation-delay:.06s!important}.mada-rx-motion:nth-child(4){animation-delay:.09s!important}.mada-rx-motion:nth-child(5){animation-delay:.12s!important}.mada-rx-motion:nth-child(6){animation-delay:.15s!important}@keyframes madaRxBounce{0%{transform:translateY(8px) scale(.65);opacity:.35}55%{transform:translateY(-5px) scale(1.18);opacity:1}100%{transform:translateY(0) scale(1);opacity:1}}@keyframes madaRxEmoji{0%{transform:scale(.65) rotate(-12deg)}55%{transform:scale(1.25) rotate(7deg)}100%{transform:scale(1) rotate(0)}}.mada-rx-touch{animation:madaRxTouch .32s cubic-bezier(.2,.9,.3,1.3)!important}@keyframes madaRxTouch{0%{transform:scale(1)}45%{transform:scale(1.28) translateY(-4px)}100%{transform:scale(1)}}`;
const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);
function emojiFrom(e){const t=e.target;return t&&t.closest?t.closest('.mada-reaction-picker .mada-reaction'):null}
function animate(b){if(!b)return;b.classList.remove('mada-rx-motion');void b.offsetWidth;b.classList.add('mada-rx-motion');setTimeout(()=>b.classList.remove('mada-rx-motion'),700)}
function bind(){
 if(document.documentElement.dataset.madaPickerMotionV2)return;document.documentElement.dataset.madaPickerMotionV2='1';
 const root=document;
 root.addEventListener('pointerdown',e=>{const b=emojiFrom(e);if(b)animate(b)},true);
 root.addEventListener('touchstart',e=>{const b=emojiFrom(e);if(b)animate(b)},true);
 root.addEventListener('click',e=>{const b=emojiFrom(e);if(b){animate(b);setTimeout(()=>animate(b),70)}},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
