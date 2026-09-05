/* Mada Reels Layout v4 — fullscreen Reels + Android back */
(function(){'use strict';
function apply(){var root=document.querySelector('.mada-reels-v3');if(!root)return;root.classList.add('mrl4-root');root.querySelectorAll('.mr-reel').forEach(function(card){card.classList.add('mrl4-card');var a=card.querySelector('.mr-actions');if(a)a.classList.add('mrl4-actions');var old=card.querySelector('.mrl2-commentbar');if(old)old.remove()})}
function css(){if(document.getElementById('mrl4-style'))return;var s=document.createElement('style');s.id='mrl4-style';s.textContent=`
html.mada-reels-open,body.mada-reels-open{overflow:hidden!important;background:#000!important}
.mada-reels-v3.mrl4-root{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;max-height:none!important;margin:0!important;padding:0!important;border-radius:0!important;z-index:2147483000!important;background:#000!important;overscroll-behavior:contain!important}
.mrl4-card{width:100vw!important;height:100dvh!important;min-height:0!important;border-radius:0!important;position:relative!important;overflow:hidden!important;scroll-snap-align:start!important}
.mrl4-card video{width:100%!important;height:100%!important;object-fit:cover!important}
.mrl4-card .mr-info{left:18px!important;right:76px!important;bottom:28px!important;z-index:30!important}
.mrl4-card .mr-actions.mrl4-actions{right:8px!important;left:auto!important;bottom:28px!important;top:auto!important;width:58px!important;z-index:40!important;display:flex!important;flex-direction:column!important;gap:8px!important}
.mrl4-card .mr-actions.mrl4-actions button{width:54px!important;min-width:54px!important;height:54px!important;min-height:54px!important;border-radius:16px!important;background:rgba(0,0,0,.48)!important;color:#fff!important}
.mrl4-root~*{z-index:auto}
@media(max-width:600px){.mrl4-card .mr-info{bottom:24px!important;left:14px!important;right:70px!important}.mrl4-card .mr-actions.mrl4-actions{right:6px!important;bottom:24px!important}}
`;
document.head.appendChild(s)}
var active=false,pushed=false,closing=false;
function enter(){if(active)return;active=true;pushed=true;try{history.pushState({madaReels:true},'',location.href)}catch(e){}document.documentElement.classList.add('mada-reels-open');document.body.classList.add('mada-reels-open');apply();var root=document.querySelector('.mada-reels-v3');if(root&&root.requestFullscreen){root.requestFullscreen().catch(function(){})}}
function leave(fromBack){if(closing)return;closing=true;active=false;document.documentElement.classList.remove('mada-reels-open');document.body.classList.remove('mada-reels-open');if(document.fullscreenElement)document.exitFullscreen().catch(function(){});if(!fromBack&&pushed){pushed=false;try{history.back()}catch(e){}}else pushed=false;setTimeout(function(){closing=false},50)}
function observe(){var ob=new MutationObserver(function(){var root=document.querySelector('.mada-reels-v3');if(root){enter();apply()}else if(active)leave(true)});ob.observe(document.body,{childList:true,subtree:true});window.addEventListener('popstate',function(){if(active){var btn=document.getElementById('closeModal');if(btn)btn.click();else{var root=document.querySelector('.mada-reels-v3');if(root)root.remove()}leave(true)}});document.addEventListener('keydown',function(e){if(e.key==='Escape'&&active){var b=document.getElementById('closeModal');if(b)b.click();leave(false)}});document.addEventListener('click',function(e){var x=e.target.closest('#closeModal');if(x&&active){setTimeout(function(){leave(false)},0)}},true)}
function boot(){css();apply();observe()}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();})();
