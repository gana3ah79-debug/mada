/* Mada Reels Layout v3 — vertical side actions */
(function(){'use strict';
function apply(){
 var root=document.querySelector('.mada-reels-v3');if(!root)return;root.classList.add('mrl3-root');
 root.querySelectorAll('.mr-reel').forEach(function(card){card.classList.add('mrl3-card');var a=card.querySelector('.mr-actions');if(a){a.classList.add('mrl3-actions');a.dataset.mrl3='1'}var old=card.querySelector('.mrl2-commentbar');if(old)old.remove();});
}
function css(){if(document.getElementById('mrl3-style'))return;var s=document.createElement('style');s.id='mrl3-style';s.textContent=`
.mada-reels-v3.mrl3-root{background:#000!important}
.mrl3-card{position:relative!important;overflow:hidden!important}
.mrl3-card .mr-info{bottom:28px!important;right:18px!important;left:85px!important;padding:0!important}
.mrl3-card .mr-actions.mrl3-actions{position:absolute!important;z-index:20!important;left:auto!important;right:10px!important;bottom:30px!important;width:62px!important;height:auto!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-end!important;gap:10px!important;padding:0!important;background:transparent!important;backdrop-filter:none!important}
.mrl3-card .mr-actions.mrl3-actions button{width:58px!important;min-width:58px!important;height:58px!important;min-height:58px!important;border:0!important;border-radius:18px!important;background:rgba(0,0,0,.52)!important;color:#fff!important;padding:4px!important;font-size:24px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:1px!important;box-shadow:0 3px 12px rgba(0,0,0,.18)!important}
.mrl3-card .mr-actions.mrl3-actions button b{font-size:10px!important;line-height:12px!important;margin:0!important;font-weight:600!important}
.mrl3-card .mr-actions.mrl3-actions button.liked,.mrl3-card .mr-actions.mrl3-actions button.saved{background:rgba(220,40,70,.72)!important}
.mrl3-card .mrl2-commentbar{display:none!important}
@media(max-width:600px){.mada-reels-v3.mrl3-root{height:calc(100vh - 125px)!important;max-height:none!important;border-radius:0!important}.mrl3-card{height:calc(100vh - 125px)!important;min-height:0!important}.mrl3-card .mr-info{bottom:28px!important;left:72px!important;right:78px!important}.mrl3-card .mr-actions.mrl3-actions{right:7px!important;bottom:24px!important;width:58px!important;gap:8px!important}.mrl3-card .mr-actions.mrl3-actions button{width:54px!important;min-width:54px!important;height:54px!important;min-height:54px!important;font-size:22px!important}}
`;
document.head.appendChild(s)}
function boot(){css();apply();new MutationObserver(apply).observe(document.body,{childList:true,subtree:true})}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();})();
