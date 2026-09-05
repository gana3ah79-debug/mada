/* Mada Reels Fullscreen v1 — mobile fullscreen + close/back */
(function(){'use strict';
var active=false,pushed=false;
function root(){return document.querySelector('.mada-reels-v3')}
function card(){var r=root();return r&&r.querySelector('.mr-reel')}
function close(){var r=root();if(!r)return;active=false;r.classList.remove('mrf-fullscreen');document.body.classList.remove('mrf-lock');var x=r.querySelector('.mrf-close');if(x)x.remove();if(document.fullscreenElement){document.exitFullscreen?.().catch(function(){})}if(pushed){pushed=false;history.back()}}
function open(){var r=root();if(!r||active)return;active=true;r.classList.add('mrf-fullscreen');document.body.classList.add('mrf-lock');var x=document.createElement('button');x.className='mrf-close';x.type='button';x.setAttribute('aria-label','إغلاق الريلز');x.textContent='×';x.onclick=function(e){e.preventDefault();e.stopPropagation();close()};r.appendChild(x);try{history.pushState({madaReelsFullscreen:true},'','#mada-reels')}catch(_){}pushed=true;var el=card();if(el&&el.requestFullscreen){el.requestFullscreen().catch(function(){})}}
function bind(){var r=root();if(!r||r.dataset.mrf)return;r.dataset.mrf='1';r.addEventListener('dblclick',function(e){if(e.target.closest('button,.mr-actions,.mr-info'))return;open()});if(!r.querySelector('.mrf-open')){var o=document.createElement('button');o.className='mrf-open';o.type='button';o.textContent='⛶';o.title='ملء الشاشة';o.onclick=function(e){e.preventDefault();e.stopPropagation();open()};r.appendChild(o)} }
function watch(){var r=root();if(r){bind();return}setTimeout(watch,250)}
window.addEventListener('popstate',function(){if(active){pushed=false;close()}});
document.addEventListener('fullscreenchange',function(){if(active&&!document.fullscreenElement){var r=root();r?.classList.remove('mrf-fullscreen');document.body.classList.remove('mrf-lock')}});
function css(){if(document.getElementById('mrf-style'))return;var s=document.createElement('style');s.id='mrf-style';s.textContent=`
body.mrf-lock{overflow:hidden!important;touch-action:none!important}
.mada-reels-v3.mrf-fullscreen{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;max-height:none!important;z-index:2147483000!important;border-radius:0!important;background:#000!important;overflow-y:auto!important;overscroll-behavior:none!important}
.mada-reels-v3.mrf-fullscreen .mr-reel{height:100dvh!important;min-height:100dvh!important;border-radius:0!important}
.mada-reels-v3.mrf-fullscreen .mr-reel video{height:100dvh!important}
.mrf-close,.mrf-open{position:absolute!important;z-index:2147483002!important;border:0!important;color:#fff!important;background:transparent!important;text-shadow:0 2px 8px #000!important;font-weight:700!important;cursor:pointer!important}
.mrf-close{top:max(10px,env(safe-area-inset-top))!important;right:14px!important;width:46px!important;height:46px!important;font-size:38px!important;line-height:42px!important}
.mrf-open{right:12px!important;top:12px!important;width:44px!important;height:44px!important;font-size:25px!important}
.mada-reels-v3.mrf-fullscreen .mrf-open{display:none!important}
@media(max-width:600px){.mrf-open{right:8px!important;top:8px!important}.mrf-close{right:8px!important}}
` ;document.head.appendChild(s)}
function boot(){css();watch();new MutationObserver(watch).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();